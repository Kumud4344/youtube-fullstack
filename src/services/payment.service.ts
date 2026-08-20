import { nanoid } from "nanoid";
import { USER_PLANS, type UserPlan } from "@/constants/app";
import { ERROR_CODES } from "@/constants/errors";
import { getPlanConfig } from "@/constants/plans";
import { AppError } from "@/lib/errors/app-error";
import { getEmailProvider } from "@/lib/email/provider";
import { logger } from "@/lib/logger";
import {
  getPaymentGateway,
  isPaidPlan,
  resolvePlanAmount,
  SUBSCRIPTION_DURATION_DAYS,
  type PaidPlan,
} from "@/lib/payments/gateway";
import {
  buildInvoiceHtml,
  formatInrFromPaise,
  planDisplayName,
} from "@/lib/payments/invoice-template";
import { Invoice } from "@/models/Invoice";
import { Payment } from "@/models/Payment";
import { PlanSubscription } from "@/models/PlanSubscription";
import { User } from "@/models/User";
import { createSessionToken, getSessionCookieMaxAgeSeconds } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/constants/app";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function refreshAuthCookie(user: {
  _id: { toString(): string };
  email: string;
  username: string;
  role: string;
  plan: string;
}) {
  const token = await createSessionToken({
    sub: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role as never,
    plan: user.plan as UserPlan,
  });
  const cookieStore = await cookies();
  const { NODE_ENV } = getEnv();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAgeSeconds(),
  });
}

export async function createUpgradeOrder(params: {
  userId: string;
  plan: string;
}) {
  if (!isPaidPlan(params.plan)) {
    throw AppError.validation("Select Bronze, Silver, or Gold to upgrade.");
  }

  const user = await User.findById(params.userId);
  if (!user) throw AppError.unauthorized();

  const plan = params.plan as PaidPlan;
  const amount = resolvePlanAmount(plan);
  const gateway = getPaymentGateway();

  const order = await gateway.createOrder({
    amountInPaise: amount,
    currency: "INR",
    receipt: `vidora_${user._id.toString().slice(-8)}_${nanoid(6)}`,
    notes: {
      userId: user._id.toString(),
      plan,
    },
  });

  const payment = await Payment.create({
    userId: user._id,
    razorpayOrderId: order.id,
    plan,
    amount,
    currency: order.currency,
    status: "created",
    provider: order.provider,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: gateway.getPublicKey(),
    plan,
    planName: getPlanConfig(plan).name,
    paymentRecordId: payment._id.toString(),
    isMock: gateway.isMock(),
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone ?? undefined,
    },
  };
}

export async function verifyAndActivatePayment(params: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const gateway = getPaymentGateway();
  const valid = gateway.verifyPaymentSignature({
    orderId: params.razorpayOrderId,
    paymentId: params.razorpayPaymentId,
    signature: params.razorpaySignature,
  });

  if (!valid) {
    logger.warn("Payment signature verification failed", {
      orderId: params.razorpayOrderId,
      userId: params.userId,
    });
    throw new AppError(
      ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
      "Payment verification failed.",
      400,
    );
  }

  return finalizeSuccessfulPayment({
    userId: params.userId,
    razorpayOrderId: params.razorpayOrderId,
    razorpayPaymentId: params.razorpayPaymentId,
    razorpaySignature: params.razorpaySignature,
  });
}

export async function finalizeSuccessfulPayment(params: {
  userId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
}) {
  const existingPaid = await Payment.findOne({
    razorpayPaymentId: params.razorpayPaymentId,
    status: "paid",
  });
  if (existingPaid) {
    const invoice = await Invoice.findOne({ paymentId: existingPaid._id });
    return {
      duplicate: true,
      paymentId: existingPaid._id.toString(),
      invoiceId: invoice?._id.toString(),
      plan: existingPaid.plan,
    };
  }

  const payment = await Payment.findOne({
    razorpayOrderId: params.razorpayOrderId,
  });
  if (!payment) {
    throw new AppError(ERROR_CODES.PAYMENT_FAILED, "Payment order not found.", 404);
  }

  if (params.userId && payment.userId.toString() !== params.userId) {
    throw AppError.forbidden("Payment does not belong to this user.");
  }

  if (payment.status === "paid") {
    const invoice = await Invoice.findOne({ paymentId: payment._id });
    return {
      duplicate: true,
      paymentId: payment._id.toString(),
      invoiceId: invoice?._id.toString(),
      plan: payment.plan,
    };
  }

  const user = await User.findById(payment.userId);
  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found.", 404);
  }

  const expectedAmount = resolvePlanAmount(payment.plan as PaidPlan);
  if (payment.amount !== expectedAmount) {
    throw new AppError(
      ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
      "Payment amount mismatch.",
      400,
    );
  }

  payment.razorpayPaymentId = params.razorpayPaymentId;
  payment.razorpaySignature = params.razorpaySignature;
  payment.status = "paid";
  await payment.save();

  const startedAt = new Date();
  const expiresAt = addDays(startedAt, SUBSCRIPTION_DURATION_DAYS);

  await PlanSubscription.updateMany(
    { userId: user._id, status: "active" },
    { $set: { status: "expired" } },
  );

  const subscription = await PlanSubscription.create({
    userId: user._id,
    plan: payment.plan,
    price: payment.amount,
    currency: payment.currency,
    startedAt,
    expiresAt,
    status: "active",
    paymentId: payment._id,
  });

  user.plan = payment.plan as UserPlan;
  user.planExpiresAt = expiresAt;
  await user.save();

  const invoiceNumber = `VID-${startedAt
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${nanoid(6).toUpperCase()}`;

  const html = buildInvoiceHtml({
    invoiceNumber,
    userName: user.name,
    planName: planDisplayName(payment.plan as UserPlan),
    amountDisplay: formatInrFromPaise(payment.amount),
    paymentId: params.razorpayPaymentId,
    orderId: payment.razorpayOrderId,
    transactionDate: startedAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
    startedAt: startedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    expiresAt: expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  });

  const invoice = await Invoice.create({
    invoiceNumber,
    userId: user._id,
    paymentId: payment._id,
    planSubscriptionId: subscription._id,
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    userName: user.name,
    userEmail: user.email,
    razorpayPaymentId: params.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    issuedAt: startedAt,
    htmlSnapshot: html,
  });

  await getEmailProvider().send({
    to: user.email,
    subject: `Vidora invoice ${invoiceNumber} — ${planDisplayName(payment.plan as UserPlan)} plan`,
    html,
    text: `Invoice ${invoiceNumber}. Plan ${payment.plan}. Amount ${formatInrFromPaise(payment.amount)}. Payment ${params.razorpayPaymentId}.`,
  });

  // Refresh JWT cookie so plan entitlement updates immediately.
  await refreshAuthCookie(user);

  logger.info("Payment activated plan", {
    userId: user._id.toString(),
    plan: payment.plan,
    paymentId: payment._id.toString(),
    invoiceNumber,
  });

  return {
    duplicate: false,
    paymentId: payment._id.toString(),
    invoiceId: invoice._id.toString(),
    invoiceNumber,
    plan: payment.plan,
    planExpiresAt: expiresAt.toISOString(),
    amount: payment.amount,
  };
}

export async function listPayments(userId: string) {
  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return payments.map((payment) => ({
    id: payment._id.toString(),
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId ?? undefined,
    createdAt: payment.createdAt.toISOString(),
  }));
}

export async function listInvoices(userId: string) {
  const invoices = await Invoice.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return invoices.map((invoice) => ({
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    plan: invoice.plan,
    amount: invoice.amount,
    currency: invoice.currency,
    razorpayPaymentId: invoice.razorpayPaymentId ?? undefined,
    issuedAt: invoice.issuedAt.toISOString(),
  }));
}

export async function getInvoiceForUser(invoiceId: string, userId: string) {
  const invoice = await Invoice.findOne({ _id: invoiceId, userId });
  if (!invoice) throw AppError.notFound("Invoice not found.");

  return {
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    plan: invoice.plan,
    planName: planDisplayName(invoice.plan as UserPlan),
    amount: invoice.amount,
    amountDisplay: formatInrFromPaise(invoice.amount),
    currency: invoice.currency,
    userName: invoice.userName,
    userEmail: invoice.userEmail,
    razorpayPaymentId: invoice.razorpayPaymentId ?? undefined,
    razorpayOrderId: invoice.razorpayOrderId ?? undefined,
    issuedAt: invoice.issuedAt.toISOString(),
    html: invoice.htmlSnapshot ?? "",
  };
}

export async function getActivePlanSubscription(userId: string) {
  const now = new Date();
  const subscription = await PlanSubscription.findOne({
    userId,
    status: "active",
    expiresAt: { $gt: now },
  }).sort({ expiresAt: -1 });

  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized();

  // Expire stale plan if needed.
  if (
    user.plan !== USER_PLANS.FREE &&
    user.planExpiresAt &&
    user.planExpiresAt.getTime() < now.getTime()
  ) {
    user.plan = USER_PLANS.FREE;
    user.planExpiresAt = null;
    await user.save();
    if (subscription) {
      subscription.status = "expired";
      await subscription.save();
    }
  }

  const plan = user.plan as UserPlan;
  return {
    plan,
    planConfig: getPlanConfig(plan),
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
    subscription: subscription
      ? {
          id: subscription._id.toString(),
          plan: subscription.plan,
          price: subscription.price,
          startedAt: subscription.startedAt.toISOString(),
          expiresAt: subscription.expiresAt.toISOString(),
          status: subscription.status,
        }
      : null,
  };
}

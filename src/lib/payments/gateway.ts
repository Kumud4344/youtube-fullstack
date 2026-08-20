import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import type { UserPlan } from "@/constants/app";
import { getPlanConfig } from "@/constants/plans";
import { logger } from "@/lib/logger";

export type CreateOrderInput = {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type CreatedOrder = {
  id: string;
  amount: number;
  currency: string;
  provider: "razorpay" | "mock";
};

export interface PaymentGateway {
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean;
  verifyWebhookSignature(body: string, signature: string): boolean;
  getPublicKey(): string;
  isMock(): boolean;
}

function getRazorpayCredentials() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "",
  };
}

class MockPaymentGateway implements PaymentGateway {
  isMock() {
    return true;
  }

  getPublicKey() {
    return "rzp_test_mock_key";
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const id = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    logger.info("Mock Razorpay order created", {
      orderId: id,
      amount: input.amountInPaise,
    });
    return {
      id,
      amount: input.amountInPaise,
      currency: input.currency ?? "INR",
      provider: "mock",
    };
  }

  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    // Dev-only mock signature format: mock_<orderId>_<paymentId>
    const expected = `mock_${params.orderId}_${params.paymentId}`;
    return params.signature === expected;
  }

  verifyWebhookSignature(): boolean {
    return process.env.NODE_ENV !== "production";
  }
}

class RazorpayPaymentGateway implements PaymentGateway {
  private client: Razorpay;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    const { keyId, keySecret, webhookSecret } = getRazorpayCredentials();
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  isMock() {
    return false;
  }

  getPublicKey() {
    return this.keyId;
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const order = await this.client.orders.create({
      amount: input.amountInPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      id: String(order.id),
      amount: Number(order.amount),
      currency: String(order.currency),
      provider: "razorpay",
    };
  }

  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const payload = `${params.orderId}|${params.paymentId}`;
    const expected = createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    try {
      return timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(params.signature),
      );
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const expected = createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex");
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

export function getPaymentGateway(): PaymentGateway {
  const mode = process.env.PAYMENT_MODE ?? "test";
  const { keyId, keySecret } = getRazorpayCredentials();

  if (!keyId || !keySecret || mode === "mock") {
    return new MockPaymentGateway();
  }

  return new RazorpayPaymentGateway();
}

export type PaidPlan = Exclude<UserPlan, "FREE">;

export function getUpgradeablePlans(): PaidPlan[] {
  return ["BRONZE", "SILVER", "GOLD"];
}

export function isPaidPlan(plan: string): plan is PaidPlan {
  return plan === "BRONZE" || plan === "SILVER" || plan === "GOLD";
}

export function resolvePlanAmount(plan: PaidPlan): number {
  return getPlanConfig(plan).priceInPaise;
}

export const SUBSCRIPTION_DURATION_DAYS = Number(
  process.env.SUBSCRIPTION_DURATION_DAYS ?? 30,
);

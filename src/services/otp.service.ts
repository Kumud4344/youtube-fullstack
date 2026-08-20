import { randomInt } from "crypto";
import { getEnv } from "@/lib/env";
import { hashOtp, verifyOtpHash } from "@/lib/auth/password";
import { resolveOtpChannel } from "@/lib/auth/otp-channel";
import { getEmailProvider } from "@/lib/email/provider";
import { getSmsProvider } from "@/lib/sms/provider";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import { OTPVerification } from "@/models/OTPVerification";
import { ERROR_CODES } from "@/constants/errors";
import { OTP_CHANNELS, type OtpChannel } from "@/constants/app";
import type { Types } from "mongoose";

function generateNumericOtp(length: number): string {
  const max = 10 ** length;
  const value = randomInt(0, max);
  return value.toString().padStart(length, "0");
}

export async function createAndSendOtp(params: {
  userId: Types.ObjectId | string;
  purpose: "LOGIN" | "REGISTER" | "RESET_PASSWORD" | "VERIFY_CONTACT";
  state?: string | null;
  email: string;
  phone?: string | null;
  forceChannel?: OtpChannel;
}) {
  const env = getEnv();
  const channel =
    params.forceChannel ?? resolveOtpChannel(params.state ?? undefined);

  if (channel === OTP_CHANNELS.MOBILE && !params.phone) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "A mobile number is required for OTP delivery in your region.",
      400,
    );
  }

  const destination =
    channel === OTP_CHANNELS.EMAIL ? params.email : (params.phone as string);

  await OTPVerification.updateMany(
    {
      userId: params.userId,
      purpose: params.purpose,
      consumedAt: null,
    },
    { $set: { consumedAt: new Date() } },
  );

  const otp = generateNumericOtp(env.OTP_LENGTH);
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60_000);

  const challenge = await OTPVerification.create({
    userId: params.userId,
    channel,
    destination,
    purpose: params.purpose,
    otpHash,
    attempts: 0,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    expiresAt,
  });

  const message = `Your Vidora verification code is ${otp}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.`;

  if (channel === OTP_CHANNELS.EMAIL) {
    await getEmailProvider().send({
      to: destination,
      subject: "Your Vidora verification code",
      text: message,
      html: `<p>Your Vidora verification code is <strong>${otp}</strong>.</p><p>It expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>`,
    });
  } else {
    await getSmsProvider().send({
      to: destination,
      message,
    });
  }

  if (env.NODE_ENV !== "production") {
    // Structured logger redacts `otp`; print plainly for local testing only.
    console.info(
      `[Vidora DEV] OTP for ${channel} ${destination}: ${otp} (challenge ${challenge._id.toString()})`,
    );
    logger.info("OTP issued in non-production mode", {
      challengeId: challenge._id.toString(),
      channel,
      destination,
    });
  }

  return {
    challengeId: challenge._id.toString(),
    channel,
    destinationHint: maskDestination(destination, channel),
    expiresAt: expiresAt.toISOString(),
    debugOtp: env.NODE_ENV !== "production" ? otp : undefined,
  };
}

export async function verifyOtpChallenge(params: {
  challengeId: string;
  otp: string;
  purpose?: "LOGIN" | "REGISTER" | "RESET_PASSWORD" | "VERIFY_CONTACT";
}) {
  const challenge = await OTPVerification.findById(params.challengeId).select(
    "+otpHash",
  );

  if (!challenge || (params.purpose && challenge.purpose !== params.purpose)) {
    throw new AppError(ERROR_CODES.OTP_INVALID, "Invalid OTP challenge.", 400);
  }

  if (challenge.consumedAt) {
    throw new AppError(
      ERROR_CODES.OTP_INVALID,
      "This OTP has already been used.",
      400,
    );
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "OTP has expired. Please request a new one.",
      400,
    );
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw new AppError(
      ERROR_CODES.OTP_LIMIT_EXCEEDED,
      "Too many invalid OTP attempts.",
      429,
    );
  }

  const valid = await verifyOtpHash(params.otp, challenge.otpHash);
  if (!valid) {
    challenge.attempts += 1;
    await challenge.save();
    throw new AppError(ERROR_CODES.OTP_INVALID, "Invalid OTP.", 400);
  }

  challenge.consumedAt = new Date();
  await challenge.save();

  return challenge;
}

function maskDestination(destination: string, channel: OtpChannel): string {
  if (channel === OTP_CHANNELS.EMAIL) {
    const [local, domain] = destination.split("@");
    if (!domain) return "***";
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  if (destination.length <= 4) return "****";
  return `${"*".repeat(Math.max(destination.length - 4, 0))}${destination.slice(-4)}`;
}

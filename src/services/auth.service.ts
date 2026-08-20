import { USER_PLANS, USER_ROLES } from "@/constants/app";
import { ERROR_CODES } from "@/constants/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/serialize-user";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { getLocationProvider } from "@/lib/location/provider";
import { logger } from "@/lib/logger";
import {
  assertLoginNotLocked,
  assertRateLimit,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/security/rate-limit";
import { User } from "@/models/User";
import { createAndSendOtp, verifyOtpChallenge } from "@/services/otp.service";
import type {
  LoginInput,
  RegisterInput,
  VerifyOtpInput,
} from "@/features/auth/schemas";

export async function registerUser(input: RegisterInput) {
  assertRateLimit(`register:${input.email}`, 5, 60_000);
  const phone = input.phone?.trim() ? input.phone.trim() : undefined;

  const existing = await User.findOne({
    $or: [
      { email: input.email.toLowerCase() },
      { username: input.username.toLowerCase() },
      ...(phone ? [{ phone }] : []),
    ],
  });

  if (existing) {
    throw new AppError(
      ERROR_CODES.USER_EXISTS,
      "An account with this email, username, or phone already exists.",
      409,
    );
  }

  const location = await getLocationProvider().resolveFromIp();
  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    name: input.name,
    username: input.username.toLowerCase(),
    email: input.email.toLowerCase(),
    phone,
    passwordHash,
    role: USER_ROLES.USER,
    plan: USER_PLANS.FREE,
    emailVerified: false,
    phoneVerified: false,
    city: input.city ?? location.city,
    state: input.state ?? location.state,
    country: input.country ?? location.country,
    location: `${input.city ?? location.city}, ${input.state ?? location.state}`,
  });

  const otpChallenge = await createAndSendOtp({
    userId: user._id,
    purpose: "REGISTER",
    state: user.state,
    email: user.email,
    phone: user.phone,
  });

  logger.info("User registered", { userId: user._id.toString() });

  return {
    user: toPublicUser(user),
    otp: otpChallenge,
  };
}

export async function loginWithPassword(input: LoginInput) {
  const identifier = input.identifier.trim().toLowerCase();
  assertRateLimit(`login:${identifier}`, 10, 60_000);
  assertLoginNotLocked(identifier);

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+passwordHash");

  if (!user) {
    recordLoginFailure(identifier);
    logger.warn("Login failed: user not found", { identifier });
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email/username or password.",
      401,
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    recordLoginFailure(identifier);
    logger.warn("Login failed: bad password", { userId: user._id.toString() });
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email/username or password.",
      401,
    );
  }

  clearLoginFailures(identifier);

  const otpChallenge = await createAndSendOtp({
    userId: user._id,
    purpose: "LOGIN",
    state: user.state,
    email: user.email,
    phone: user.phone,
  });

  return {
    requiresOtp: true as const,
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      state: user.state,
    },
    otp: otpChallenge,
  };
}

export async function verifyAuthOtp(input: VerifyOtpInput) {
  assertRateLimit(`otp-verify:${input.challengeId}`, 10, 60_000);

  const challenge = await verifyOtpChallenge({
    challengeId: input.challengeId,
    otp: input.otp,
  });

  const user = await User.findById(challenge.userId);
  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found.", 404);
  }

  if (challenge.channel === "EMAIL") {
    user.emailVerified = true;
  }
  if (challenge.channel === "MOBILE") {
    user.phoneVerified = true;
  }
  user.lastLoginAt = new Date();
  await user.save();

  await setAuthCookie({
    sub: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
    plan: user.plan,
  });

  logger.info("User authenticated via OTP", {
    userId: user._id.toString(),
    purpose: challenge.purpose,
  });

  return {
    user: toPublicUser(user),
  };
}

export async function logoutUser() {
  await clearAuthCookie();
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.unauthorized();
  }
  return toPublicUser(user);
}

import { AppError } from "@/lib/errors/app-error";
import { getEnv } from "@/lib/env";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function assertRateLimit(
  key: string,
  maxRequests?: number,
  windowMs?: number,
): void {
  const env = getEnv();
  const limit = maxRequests ?? env.RATE_LIMIT_MAX_REQUESTS;
  const window = windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + window });
    return;
  }

  if (existing.count >= limit) {
    throw AppError.rateLimited();
  }

  existing.count += 1;
  buckets.set(key, existing);
}

/** In-memory login attempt tracking (replace with Redis in production). */
type LoginAttemptState = {
  failures: number;
  lockedUntil?: number;
};

const loginAttempts = new Map<string, LoginAttemptState>();

export function assertLoginNotLocked(identifier: string): void {
  const state = loginAttempts.get(identifier.toLowerCase());
  if (!state?.lockedUntil) return;
  if (state.lockedUntil > Date.now()) {
    throw new AppError(
      "LOGIN_LOCKED",
      "Too many failed login attempts. Please try again later.",
      429,
    );
  }
}

export function recordLoginFailure(identifier: string): void {
  const env = getEnv();
  const key = identifier.toLowerCase();
  const state = loginAttempts.get(key) ?? { failures: 0 };
  state.failures += 1;

  if (state.failures >= env.LOGIN_MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + env.LOGIN_LOCKOUT_MINUTES * 60_000;
    state.failures = 0;
  }

  loginAttempts.set(key, state);
}

export function clearLoginFailures(identifier: string): void {
  loginAttempts.delete(identifier.toLowerCase());
}

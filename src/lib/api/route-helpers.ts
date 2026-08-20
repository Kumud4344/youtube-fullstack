import { ZodError } from "zod";
import { ERROR_CODES } from "@/constants/errors";
import { apiError } from "@/lib/api/response";
import type { SessionPayload } from "@/lib/auth/jwt";
import { getSessionFromCookies } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AppError, isAppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";

export async function withDb<T>(handler: () => Promise<T>): Promise<T> {
  await connectToDatabase();
  return handler();
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(
      ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      error.flatten(),
    );
  }

  if (isAppError(error)) {
    return apiError(error.code, error.message, error.status, error.details);
  }

  logger.error("Unhandled API error", {
    error: error instanceof Error ? error.message : "unknown",
  });

  return apiError(
    ERROR_CODES.INTERNAL_ERROR,
    "Something went wrong. Please try again.",
    500,
  );
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSessionFromCookies();
  if (!session) {
    throw AppError.unauthorized();
  }
  return session;
}

import { ERROR_CODES, type ErrorCode } from "@/constants/errors";

export class AppError extends Error {
  readonly code: ErrorCode | string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ErrorCode | string,
    message: string,
    status = 400,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(ERROR_CODES.AUTH_REQUIRED, message, 401);
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(ERROR_CODES.FORBIDDEN, message, 403);
  }

  static notFound(message = "Resource not found") {
    return new AppError(ERROR_CODES.NOT_FOUND, message, 404);
  }

  static validation(message: string, details?: unknown) {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }

  static rateLimited(message = "Too many requests. Please try again later.") {
    return new AppError(ERROR_CODES.RATE_LIMITED, message, 429);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

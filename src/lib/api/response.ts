import { NextResponse } from "next/server";
import type { ErrorCode } from "@/constants/errors";
import type { ApiErrorBody, ApiSuccess } from "@/types/api";

export function apiSuccess<T>(
  data: T,
  message = "Operation successful",
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      message,
    },
    init,
  );
}

export function apiError(
  code: ErrorCode | string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status },
  );
}

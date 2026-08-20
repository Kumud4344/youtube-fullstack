import {
  COMMENT_MODERATION_CONFIG,
} from "@/constants/comments";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/constants/errors";

export function sanitizeCommentText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function assertCommentAllowed(text: string): void {
  const cleaned = sanitizeCommentText(text);
  if (!cleaned) {
    throw AppError.validation("Comment cannot be empty.");
  }
  if (cleaned.length > COMMENT_MODERATION_CONFIG.MAX_LENGTH) {
    throw AppError.validation("Comment is too long.");
  }

  for (const pattern of COMMENT_MODERATION_CONFIG.PROHIBITED_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(cleaned)) {
      throw new AppError(
        ERROR_CODES.COMMENT_BLOCKED,
        "Comment blocked by moderation policy.",
        400,
      );
    }
  }
}

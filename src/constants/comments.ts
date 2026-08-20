export const COMMENT_STATUS = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
  REMOVED: "removed",
} as const;

export type CommentStatus =
  (typeof COMMENT_STATUS)[keyof typeof COMMENT_STATUS];

export const REACTION_TYPES = {
  LIKE: "like",
  DISLIKE: "dislike",
} as const;

export type ReactionType = (typeof REACTION_TYPES)[keyof typeof REACTION_TYPES];

export const SUPPORTED_TRANSLATION_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
] as const;

/**
 * Configurable comment moderation.
 * Only blocks control chars / clearly unsafe patterns — not international scripts.
 */
export const COMMENT_MODERATION_CONFIG = {
  AUTO_HIDE_DISLIKE_THRESHOLD: Number(
    process.env.COMMENT_AUTO_HIDE_DISLIKES ?? 2,
  ),
  MAX_LENGTH: 2000,
  RATE_LIMIT_PER_MINUTE: 8,
  PROHIBITED_PATTERNS: [
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
    /(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|tinyurl\.com)\/\S+/gi,
  ] as RegExp[],
} as const;

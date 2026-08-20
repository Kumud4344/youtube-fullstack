export const APP_NAME = "YouTube";
export const APP_DESCRIPTION =
  "A modern YouTube-inspired video sharing platform.";

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "vidora_session";

export const SOUTH_INDIAN_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
] as const;

export type SouthIndianState = (typeof SOUTH_INDIAN_STATES)[number];

export const OTP_CHANNELS = {
  EMAIL: "EMAIL",
  MOBILE: "MOBILE",
} as const;

export type OtpChannel = (typeof OTP_CHANNELS)[keyof typeof OTP_CHANNELS];

export const USER_ROLES = {
  USER: "USER",
  CREATOR: "CREATOR",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_PLANS = {
  FREE: "FREE",
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
} as const;

export type UserPlan = (typeof USER_PLANS)[keyof typeof USER_PLANS];

export const GESTURE_CONFIG = {
  DOUBLE_TAP_DELAY: 300,
  TRIPLE_TAP_DELAY: 500,
} as const;

export const COMMENT_MODERATION = {
  AUTO_HIDE_DISLIKE_THRESHOLD: 2,
  PROHIBITED_PATTERNS: [
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
  ],
} as const;

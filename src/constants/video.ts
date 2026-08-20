export const VIDEO_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
  UNLISTED: "unlisted",
} as const;

export type VideoVisibility =
  (typeof VIDEO_VISIBILITY)[keyof typeof VIDEO_VISIBILITY];

export const VIDEO_PROCESSING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
} as const;

export type VideoProcessingStatus =
  (typeof VIDEO_PROCESSING_STATUS)[keyof typeof VIDEO_PROCESSING_STATUS];

export const VIDEO_UPLOAD_STATUS = {
  PREPARING: "preparing",
  UPLOADING: "uploading",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const VIDEO_CATEGORIES = [
  "Music",
  "Gaming",
  "Movies",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
  "Tech",
  "Other",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const VIDEO_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 500 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
  ] as const,
  ALLOWED_EXTENSIONS: [".mp4", ".webm", ".mov", ".mkv"] as const,
  MAX_THUMBNAIL_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_THUMBNAIL_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const,
} as const;

import { z } from "zod";
import {
  VIDEO_CATEGORIES,
  VIDEO_UPLOAD_LIMITS,
  VIDEO_VISIBILITY,
} from "@/constants/video";

export const videoMetadataSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).default(""),
  category: z.enum(VIDEO_CATEGORIES).default("Other"),
  tags: z
    .union([z.array(z.string()), z.string()])
    .transform((value) => {
      const items = Array.isArray(value)
        ? value
        : value.split(",").map((item) => item.trim());
      return items
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12);
    })
    .default([]),
  visibility: z
    .enum([
      VIDEO_VISIBILITY.PUBLIC,
      VIDEO_VISIBILITY.PRIVATE,
      VIDEO_VISIBILITY.UNLISTED,
    ])
    .default(VIDEO_VISIBILITY.PUBLIC),
  duration: z.coerce.number().min(0).max(60 * 60 * 12).optional(),
});

export const watchProgressSchema = z.object({
  position: z.number().min(0),
  watchedSeconds: z.number().min(0),
  completed: z.boolean().optional(),
});

export const videoListQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["latest", "popular", "trending"]).default("latest"),
});

export type VideoMetadataInput = z.infer<typeof videoMetadataSchema>;

export function assertValidVideoFile(file: File) {
  if (!VIDEO_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as never)) {
    throw new Error("Unsupported video type. Use MP4, WebM, MOV, or MKV.");
  }
  if (file.size <= 0) {
    throw new Error("Video file is empty.");
  }
  if (file.size > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    throw new Error("Video exceeds the 500MB upload limit.");
  }
  const lower = file.name.toLowerCase();
  const hasExt = VIDEO_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.some((ext) =>
    lower.endsWith(ext),
  );
  if (!hasExt) {
    throw new Error("Invalid video file extension.");
  }
}

export function assertValidThumbnailFile(file: File) {
  if (
    !VIDEO_UPLOAD_LIMITS.ALLOWED_THUMBNAIL_MIME_TYPES.includes(file.type as never)
  ) {
    throw new Error("Thumbnail must be JPEG, PNG, or WebP.");
  }
  if (file.size > VIDEO_UPLOAD_LIMITS.MAX_THUMBNAIL_SIZE_BYTES) {
    throw new Error("Thumbnail exceeds the 5MB limit.");
  }
}

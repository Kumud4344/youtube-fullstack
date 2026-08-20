import { z } from "zod";
import { SUPPORTED_TRANSLATION_LANGUAGES } from "@/constants/comments";

export const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const translateCommentSchema = z.object({
  targetLanguage: z
    .string()
    .trim()
    .refine(
      (code) =>
        SUPPORTED_TRANSLATION_LANGUAGES.some((item) => item.code === code),
      "Unsupported target language",
    ),
  persist: z.boolean().optional(),
});

export const createPlaylistSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["public", "private"]).default("private"),
});

export const updatePlaylistSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export const playlistVideoSchema = z.object({
  videoId: z.string().min(1),
});

export const reorderPlaylistSchema = z.object({
  videoIds: z.array(z.string().min(1)).min(1),
});

import { Types } from "mongoose";
import {
  COMMENT_MODERATION_CONFIG,
  COMMENT_STATUS,
  REACTION_TYPES,
} from "@/constants/comments";
import { ERROR_CODES } from "@/constants/errors";
import {
  assertCommentAllowed,
  sanitizeCommentText,
} from "@/lib/comments/moderation";
import { AppError } from "@/lib/errors/app-error";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getTranslationProvider } from "@/lib/translation/provider";
import { Comment } from "@/models/Comment";
import { CommentReaction } from "@/models/CommentReaction";
import { User } from "@/models/User";
import { Video } from "@/models/Video";
import { timeAgo } from "@/utils/video";

export type PublicComment = {
  id: string;
  videoId: string;
  text: string;
  originalLanguage: string;
  translatedLanguage?: string;
  translatedText?: string;
  city?: string;
  likes: number;
  dislikes: number;
  status: string;
  createdAt: string;
  displayMeta: string;
  viewerReaction?: "like" | "dislike" | null;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
};

async function toPublicComment(
  comment: {
    _id: Types.ObjectId;
    videoId: Types.ObjectId;
    userId: Types.ObjectId;
    text: string;
    originalLanguage?: string | null;
    translatedLanguage?: string | null;
    translatedText?: string | null;
    city?: string | null;
    likes?: number | null;
    dislikes?: number | null;
    status: string;
    createdAt: Date;
  },
  author?: {
    _id: Types.ObjectId;
    name: string;
    username: string;
    avatar?: string | null;
  } | null,
  viewerReaction?: "like" | "dislike" | null,
): Promise<PublicComment> {
  const username = author?.username ?? "user";
  const city = comment.city || undefined;
  const ago = timeAgo(comment.createdAt);

  return {
    id: comment._id.toString(),
    videoId: comment.videoId.toString(),
    text: comment.text,
    originalLanguage: comment.originalLanguage ?? "und",
    translatedLanguage: comment.translatedLanguage ?? undefined,
    translatedText: comment.translatedText ?? undefined,
    city,
    likes: comment.likes ?? 0,
    dislikes: comment.dislikes ?? 0,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    displayMeta: [username, city, ago].filter(Boolean).join(" • "),
    viewerReaction: viewerReaction ?? null,
    user: {
      id: author?._id.toString() ?? comment.userId.toString(),
      name: author?.name ?? "Unknown",
      username,
      avatar: author?.avatar ?? undefined,
    },
  };
}

export async function createComment(params: {
  videoId: string;
  userId: string;
  text: string;
}) {
  assertRateLimit(
    `comment:${params.userId}`,
    COMMENT_MODERATION_CONFIG.RATE_LIMIT_PER_MINUTE,
    60_000,
  );

  if (!Types.ObjectId.isValid(params.videoId)) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const video = await Video.findById(params.videoId);
  if (!video) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const text = sanitizeCommentText(params.text);
  assertCommentAllowed(text);

  const user = await User.findById(params.userId);
  if (!user) throw AppError.unauthorized();

  const detected = await getTranslationProvider().detectLanguage(text);

  const comment = await Comment.create({
    videoId: params.videoId,
    userId: params.userId,
    text,
    originalLanguage: detected,
    city: user.city,
    status: COMMENT_STATUS.VISIBLE,
  });

  await Video.findByIdAndUpdate(params.videoId, { $inc: { commentsCount: 1 } });

  return toPublicComment(comment, user, null);
}

export async function listComments(params: {
  videoId: string;
  viewerId?: string;
  cursor?: string;
  limit?: number;
}) {
  const limit = params.limit ?? 20;
  const filter: Record<string, unknown> = {
    videoId: params.videoId,
    status: COMMENT_STATUS.VISIBLE,
  };

  if (params.cursor && Types.ObjectId.isValid(params.cursor)) {
    filter._id = { $lt: new Types.ObjectId(params.cursor) };
  }

  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const page = comments.length > limit ? comments.slice(0, limit) : comments;
  const userIds = [...new Set(page.map((item) => item.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  let reactionMap = new Map<string, "like" | "dislike">();
  if (params.viewerId) {
    const reactions = await CommentReaction.find({
      userId: params.viewerId,
      commentId: { $in: page.map((item) => item._id) },
    }).lean();
    reactionMap = new Map(
      reactions.map((item) => [
        item.commentId.toString(),
        item.type as "like" | "dislike",
      ]),
    );
  }

  const items = await Promise.all(
    page.map((comment) =>
      toPublicComment(
        comment,
        userMap.get(comment.userId.toString()),
        reactionMap.get(comment._id.toString()) ?? null,
      ),
    ),
  );

  return {
    items,
    nextCursor:
      comments.length > limit ? page[page.length - 1]?._id.toString() : null,
  };
}

export async function reactToComment(params: {
  commentId: string;
  userId: string;
  type: "like" | "dislike";
}) {
  assertRateLimit(`comment-react:${params.userId}`, 30, 60_000);

  const comment = await Comment.findById(params.commentId);
  if (!comment || comment.status === COMMENT_STATUS.REMOVED) {
    throw new AppError(ERROR_CODES.COMMENT_NOT_FOUND, "Comment not found.", 404);
  }

  const existing = await CommentReaction.findOne({
    commentId: params.commentId,
    userId: params.userId,
  });

  if (existing?.type === params.type) {
    await existing.deleteOne();
    if (params.type === REACTION_TYPES.LIKE) {
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.dislikes = Math.max(0, comment.dislikes - 1);
    }
  } else if (existing) {
    const previous = existing.type;
    existing.type = params.type;
    await existing.save();
    if (previous === REACTION_TYPES.LIKE) {
      comment.likes = Math.max(0, comment.likes - 1);
      comment.dislikes += 1;
    } else {
      comment.dislikes = Math.max(0, comment.dislikes - 1);
      comment.likes += 1;
    }
  } else {
    await CommentReaction.create({
      commentId: params.commentId,
      userId: params.userId,
      type: params.type,
    });
    if (params.type === REACTION_TYPES.LIKE) {
      comment.likes += 1;
    } else {
      comment.dislikes += 1;
    }
  }

  // Auto-hide when disliked by others enough times (author's own dislike excluded via separate users).
  const uniqueDislikes = await CommentReaction.countDocuments({
    commentId: params.commentId,
    type: REACTION_TYPES.DISLIKE,
    userId: { $ne: comment.userId },
  });

  if (
    uniqueDislikes >= COMMENT_MODERATION_CONFIG.AUTO_HIDE_DISLIKE_THRESHOLD &&
    comment.status === COMMENT_STATUS.VISIBLE
  ) {
    comment.status = COMMENT_STATUS.HIDDEN;
    await Video.findByIdAndUpdate(comment.videoId, {
      $inc: { commentsCount: -1 },
    });
  }

  await comment.save();

  const author = await User.findById(comment.userId);
  const viewerReaction = await CommentReaction.findOne({
    commentId: params.commentId,
    userId: params.userId,
  });

  return toPublicComment(
    comment,
    author,
    (viewerReaction?.type as "like" | "dislike" | undefined) ?? null,
  );
}

export async function translateComment(params: {
  commentId: string;
  targetLanguage: string;
  persist?: boolean;
}) {
  const comment = await Comment.findById(params.commentId);
  if (!comment || comment.status !== COMMENT_STATUS.VISIBLE) {
    throw new AppError(ERROR_CODES.COMMENT_NOT_FOUND, "Comment not found.", 404);
  }

  const result = await getTranslationProvider().translate({
    text: comment.text,
    targetLanguage: params.targetLanguage,
    sourceLanguage: comment.originalLanguage ?? undefined,
  });

  // Never overwrite original text; store translation separately when requested.
  if (params.persist !== false) {
    comment.translatedLanguage = result.targetLanguage;
    comment.translatedText = result.translatedText;
    if (!comment.originalLanguage || comment.originalLanguage === "und") {
      comment.originalLanguage = result.detectedLanguage;
    }
    await comment.save();
  }

  return {
    originalText: comment.text,
    translatedText: result.translatedText,
    originalLanguage: result.detectedLanguage,
    translatedLanguage: result.targetLanguage,
    provider: result.provider,
  };
}

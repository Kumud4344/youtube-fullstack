import { Types } from "mongoose";
import { REACTION_TYPES } from "@/constants/comments";
import { ERROR_CODES } from "@/constants/errors";
import { AppError } from "@/lib/errors/app-error";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { Video } from "@/models/Video";
import { VideoReaction } from "@/models/VideoReaction";
import { User } from "@/models/User";
import { getVideoByIdOrSlug, type PublicVideo } from "@/services/video.service";

export async function reactToVideo(params: {
  videoId: string;
  userId: string;
  type: "like" | "dislike";
}) {
  assertRateLimit(`video-react:${params.userId}`, 40, 60_000);

  if (!Types.ObjectId.isValid(params.videoId)) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const video = await Video.findById(params.videoId);
  if (!video) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const existing = await VideoReaction.findOne({
    videoId: params.videoId,
    userId: params.userId,
  });

  let viewerReaction: "like" | "dislike" | null = params.type;

  if (existing?.type === params.type) {
    await existing.deleteOne();
    viewerReaction = null;
    if (params.type === REACTION_TYPES.LIKE) {
      video.likesCount = Math.max(0, video.likesCount - 1);
    } else {
      video.dislikesCount = Math.max(0, video.dislikesCount - 1);
    }
  } else if (existing) {
    const previous = existing.type;
    existing.type = params.type;
    await existing.save();
    if (previous === REACTION_TYPES.LIKE) {
      video.likesCount = Math.max(0, video.likesCount - 1);
      video.dislikesCount += 1;
    } else {
      video.dislikesCount = Math.max(0, video.dislikesCount - 1);
      video.likesCount += 1;
    }
  } else {
    await VideoReaction.create({
      videoId: params.videoId,
      userId: params.userId,
      type: params.type,
    });
    if (params.type === REACTION_TYPES.LIKE) {
      video.likesCount += 1;
    } else {
      video.dislikesCount += 1;
    }
  }

  await video.save();

  return {
    likesCount: video.likesCount,
    dislikesCount: video.dislikesCount,
    viewerReaction,
  };
}

export async function getViewerVideoReaction(
  videoId: string,
  userId?: string,
): Promise<"like" | "dislike" | null> {
  if (!userId) return null;
  const reaction = await VideoReaction.findOne({ videoId, userId }).lean();
  return (reaction?.type as "like" | "dislike" | undefined) ?? null;
}

export async function listLikedVideos(userId: string): Promise<PublicVideo[]> {
  const reactions = await VideoReaction.find({
    userId,
    type: REACTION_TYPES.LIKE,
  })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  const items: PublicVideo[] = [];
  for (const reaction of reactions) {
    try {
      items.push(await getVideoByIdOrSlug(reaction.videoId.toString(), userId));
    } catch {
      // skip inaccessible
    }
  }
  return items;
}

export async function ensureUserExists(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized();
  return user;
}

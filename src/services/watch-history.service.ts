import { Types } from "mongoose";
import type { UserPlan } from "@/constants/app";
import { AppError, isAppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/constants/errors";
import { WatchHistory } from "@/models/WatchHistory";
import { Video } from "@/models/Video";
import { User } from "@/models/User";
import type { PublicVideo } from "@/types/video";
import { getVideoByIdOrSlug } from "@/services/video.service";
import {
  assertWatchProgressAllowed,
  getWatchEntitlement,
} from "@/services/watch-entitlement.service";

export async function upsertWatchProgress(params: {
  userId: string;
  videoId: string;
  position: number;
  watchedSeconds: number;
  completed?: boolean;
}) {
  if (!Types.ObjectId.isValid(params.videoId)) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const video = await Video.findById(params.videoId);
  if (!video) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const user = await User.findById(params.userId);
  if (!user) throw AppError.unauthorized();

  const existing = await WatchHistory.findOne({
    userId: params.userId,
    videoId: params.videoId,
  });

  let capped: {
    position: number;
    watchedSeconds: number;
    limitReached: boolean;
    watchLimitSeconds: number | null;
  };

  try {
    capped = assertWatchProgressAllowed({
      plan: user.plan as UserPlan,
      requestedPosition: params.position,
      requestedWatchedSeconds: params.watchedSeconds,
      previousWatchedSeconds: existing?.watchedSeconds ?? 0,
    });
  } catch (error) {
    if (isAppError(error) && error.code === ERROR_CODES.WATCH_LIMIT_REACHED) {
      const details = (error.details ?? {}) as {
        position?: number;
        watchedSeconds?: number;
        watchLimitSeconds?: number;
      };
      const position = details.position ?? 0;
      const watchedSeconds = details.watchedSeconds ?? 0;
      const completed =
        params.completed ??
        (video.duration > 0 && position / video.duration >= 0.9);

      const entry = await WatchHistory.findOneAndUpdate(
        { userId: params.userId, videoId: params.videoId },
        {
          $set: {
            lastPosition: position,
            watchedSeconds,
            completed,
          },
          $setOnInsert: { startedAt: new Date() },
        },
        { upsert: true, new: true },
      );

      throw new AppError(ERROR_CODES.WATCH_LIMIT_REACHED, error.message, 403, {
        ...details,
        entryId: entry._id.toString(),
        completed: entry.completed,
        entitlement: await getWatchEntitlement({
          userId: params.userId,
          videoId: params.videoId,
        }),
      });
    }
    throw error;
  }

  const completed =
    params.completed ??
    (video.duration > 0 && capped.position / video.duration >= 0.9);

  const entry = await WatchHistory.findOneAndUpdate(
    { userId: params.userId, videoId: params.videoId },
    {
      $set: {
        lastPosition: capped.position,
        watchedSeconds: capped.watchedSeconds,
        completed,
      },
      $setOnInsert: {
        startedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  const entitlement = await getWatchEntitlement({
    userId: params.userId,
    videoId: params.videoId,
  });

  return { entry, entitlement };
}

export async function listWatchHistory(userId: string) {
  const entries = await WatchHistory.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  const items: Array<{
    id: string;
    lastPosition: number;
    watchedSeconds: number;
    completed: boolean;
    updatedAt: string;
    video: PublicVideo;
  }> = [];

  for (const entry of entries) {
    try {
      const video = await getVideoByIdOrSlug(entry.videoId.toString(), userId);
      items.push({
        id: entry._id.toString(),
        lastPosition: entry.lastPosition,
        watchedSeconds: entry.watchedSeconds,
        completed: entry.completed,
        updatedAt: entry.updatedAt.toISOString(),
        video,
      });
    } catch {
      // Skip inaccessible/deleted videos.
    }
  }

  return items;
}

export async function clearWatchHistoryItem(userId: string, historyId: string) {
  await WatchHistory.deleteOne({ _id: historyId, userId });
}

export async function clearAllWatchHistory(userId: string) {
  await WatchHistory.deleteMany({ userId });
}

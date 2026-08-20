import { Types } from "mongoose";
import type { UserPlan } from "@/constants/app";
import { ERROR_CODES } from "@/constants/errors";
import { getDailyDownloadLimit } from "@/constants/plans";
import {
  VIDEO_PROCESSING_STATUS,
  VIDEO_VISIBILITY,
} from "@/constants/video";
import { AppError } from "@/lib/errors/app-error";
import { getVideoStorage } from "@/lib/storage/local";
import { getDayRangeForTimezone } from "@/lib/time/timezone";
import { Download } from "@/models/Download";
import { User } from "@/models/User";
import { Video } from "@/models/Video";
import { getVideoByIdOrSlug, type PublicVideo } from "@/services/video.service";

export type DownloadEntitlement = {
  plan: UserPlan;
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  limitReached: boolean;
  timezone: string;
  dayKey: string;
};

function appTimezone() {
  return process.env.APP_TIMEZONE ?? "Asia/Kolkata";
}

export async function getDownloadEntitlement(
  userId: string,
): Promise<DownloadEntitlement> {
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthorized();

  const plan = user.plan as UserPlan;
  const dailyLimit = getDailyDownloadLimit(plan);
  const timezone = appTimezone();
  const { start, end, dayKey } = getDayRangeForTimezone(timezone);

  const usedToday = await Download.countDocuments({
    userId,
    status: "completed",
    downloadedAt: { $gte: start, $lt: end },
  });

  if (dailyLimit === null) {
    return {
      plan,
      dailyLimit: null,
      usedToday,
      remainingToday: null,
      limitReached: false,
      timezone,
      dayKey,
    };
  }

  return {
    plan,
    dailyLimit,
    usedToday,
    remainingToday: Math.max(0, dailyLimit - usedToday),
    limitReached: usedToday >= dailyLimit,
    timezone,
    dayKey,
  };
}

export async function assertCanDownload(userId: string) {
  const entitlement = await getDownloadEntitlement(userId);
  if (entitlement.limitReached) {
    throw new AppError(
      ERROR_CODES.DOWNLOAD_LIMIT_REACHED,
      "You have reached today's free download limit. Upgrade to Premium for unlimited downloads.",
      403,
      entitlement,
    );
  }
  return entitlement;
}

export async function createVideoDownload(params: {
  userId: string;
  videoId: string;
}) {
  if (!Types.ObjectId.isValid(params.videoId)) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  const video = await Video.findById(params.videoId);
  if (!video) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  if (video.processingStatus !== VIDEO_PROCESSING_STATUS.READY) {
    throw new AppError(
      ERROR_CODES.VIDEO_PROCESSING,
      "Video is still processing.",
      409,
    );
  }

  const isOwner = video.ownerId.toString() === params.userId;
  if (video.visibility === VIDEO_VISIBILITY.PRIVATE && !isOwner) {
    throw new AppError(
      ERROR_CODES.VIDEO_ACCESS_DENIED,
      "You do not have access to this video.",
      403,
    );
  }

  const entitlement = await assertCanDownload(params.userId);
  const storage = getVideoStorage();
  const downloadUrl = await storage.getDownloadUrl(video.storageKey);

  const record = await Download.create({
    userId: params.userId,
    videoId: video._id,
    downloadedAt: new Date(),
    fileSize: video.fileSize,
    status: "completed",
    dayKey: entitlement.dayKey,
  });

  await Video.findByIdAndUpdate(video._id, { $inc: { downloadsCount: 1 } });

  const nextEntitlement = await getDownloadEntitlement(params.userId);

  return {
    download: {
      id: record._id.toString(),
      videoId: video._id.toString(),
      fileSize: record.fileSize,
      downloadedAt: record.downloadedAt.toISOString(),
      status: record.status,
      title: video.title,
      mimeType: video.mimeType,
      storageKey: video.storageKey,
    },
    downloadUrl,
    entitlement: nextEntitlement,
  };
}

export async function listUserDownloads(userId: string) {
  const rows = await Download.find({ userId, status: "completed" })
    .sort({ downloadedAt: -1 })
    .limit(50)
    .lean();

  const items: Array<{
    id: string;
    downloadedAt: string;
    fileSize: number;
    status: string;
    video: PublicVideo;
  }> = [];

  for (const row of rows) {
    try {
      const video = await getVideoByIdOrSlug(row.videoId.toString(), userId);
      items.push({
        id: row._id.toString(),
        downloadedAt: row.downloadedAt.toISOString(),
        fileSize: row.fileSize,
        status: row.status,
        video,
      });
    } catch {
      // skip deleted/inaccessible
    }
  }

  const entitlement = await getDownloadEntitlement(userId);
  return { items, entitlement };
}

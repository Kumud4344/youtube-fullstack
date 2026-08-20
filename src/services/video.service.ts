import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { ERROR_CODES } from "@/constants/errors";
import {
  VIDEO_CATEGORIES,
  VIDEO_PROCESSING_STATUS,
  VIDEO_VISIBILITY,
} from "@/constants/video";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import { getVideoStorage } from "@/lib/storage/local";
import { Video } from "@/models/Video";
import { User } from "@/models/User";
import { slugify } from "@/utils/video";
import type { VideoMetadataInput } from "@/features/videos/schemas";
import type { PublicVideo } from "@/types/video";

export type { PublicVideo };

function toPublicVideo(
  video: {
    _id: Types.ObjectId;
    title: string;
    description?: string | null;
    slug: string;
    ownerId: Types.ObjectId;
    videoUrl: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
    views?: number | null;
    likesCount?: number | null;
    dislikesCount?: number | null;
    commentsCount?: number | null;
    downloadsCount?: number | null;
    visibility: string;
    tags?: string[] | null;
    category: string;
    fileSize: number;
    mimeType: string;
    processingStatus: string;
    createdAt: Date;
    updatedAt: Date;
  },
  channel?: {
    _id: Types.ObjectId;
    name: string;
    username: string;
    avatar?: string | null;
  } | null,
): PublicVideo {
  return {
    id: video._id.toString(),
    title: video.title,
    description: video.description ?? "",
    slug: video.slug,
    ownerId: video.ownerId.toString(),
    channel: {
      id: channel?._id.toString() ?? video.ownerId.toString(),
      name: channel?.name ?? "Unknown",
      username: channel?.username ?? "unknown",
      avatar: channel?.avatar ?? undefined,
    },
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    duration: video.duration ?? 0,
    views: video.views ?? 0,
    likesCount: video.likesCount ?? 0,
    dislikesCount: video.dislikesCount ?? 0,
    commentsCount: video.commentsCount ?? 0,
    downloadsCount: video.downloadsCount ?? 0,
    visibility: video.visibility,
    tags: video.tags ?? [],
    category: video.category,
    fileSize: video.fileSize,
    mimeType: video.mimeType,
    processingStatus: video.processingStatus,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "video";
  let candidate = base;
  for (let i = 0; i < 5; i += 1) {
    const exists = await Video.exists({ slug: candidate });
    if (!exists) return candidate;
    candidate = `${base}-${nanoid(6).toLowerCase()}`;
  }
  return `${base}-${nanoid(8).toLowerCase()}`;
}

export async function createVideoUpload(params: {
  ownerId: string;
  metadata: VideoMetadataInput;
  videoFile: File;
  thumbnailFile?: File | null;
}) {
  const storage = getVideoStorage();
  const videoBuffer = Buffer.from(await params.videoFile.arrayBuffer());

  const stored = await storage.upload(videoBuffer, {
    filename: params.videoFile.name,
    mimeType: params.videoFile.type,
    ownerId: params.ownerId,
    size: params.videoFile.size,
  });

  let thumbnailKey: string | undefined;
  let thumbnailUrl: string | undefined;

  if (params.thumbnailFile) {
    const thumbBuffer = Buffer.from(await params.thumbnailFile.arrayBuffer());
    const thumb = await storage.uploadThumbnail(thumbBuffer, {
      filename: params.thumbnailFile.name,
      mimeType: params.thumbnailFile.type,
      ownerId: params.ownerId,
      size: params.thumbnailFile.size,
    });
    thumbnailKey = thumb.key;
    thumbnailUrl = thumb.url;
  }

  const slug = await uniqueSlug(params.metadata.title);

  // Local development: mark ready immediately. Future: enqueue FFmpeg jobs.
  const video = await Video.create({
    title: params.metadata.title,
    description: params.metadata.description,
    slug,
    ownerId: params.ownerId,
    channelId: params.ownerId,
    storageKey: stored.key,
    videoUrl: stored.url,
    thumbnailKey,
    thumbnailUrl,
    duration: params.metadata.duration ?? 0,
    visibility: params.metadata.visibility,
    tags: params.metadata.tags,
    category: params.metadata.category,
    fileSize: params.videoFile.size,
    mimeType: params.videoFile.type,
    processingStatus: VIDEO_PROCESSING_STATUS.READY,
  });

  const owner = await User.findById(params.ownerId);
  logger.info("Video uploaded", {
    videoId: video._id.toString(),
    ownerId: params.ownerId,
  });

  return toPublicVideo(video, owner);
}

export async function listVideos(params: {
  q?: string;
  category?: string;
  cursor?: string;
  limit: number;
  sort: "latest" | "popular" | "trending";
  viewerId?: string;
}) {
  const filter: Record<string, unknown> = {
    processingStatus: VIDEO_PROCESSING_STATUS.READY,
    visibility: VIDEO_VISIBILITY.PUBLIC,
  };

  if (params.category && params.category !== "All") {
    filter.category = params.category;
  }

  if (params.q) {
    filter.$text = { $search: params.q };
  }

  if (params.cursor && Types.ObjectId.isValid(params.cursor)) {
    filter._id = { $lt: new Types.ObjectId(params.cursor) };
  }

  const sort: Record<string, 1 | -1> =
    params.sort === "popular" || params.sort === "trending"
      ? { views: -1, createdAt: -1 }
      : { createdAt: -1 };

  const videos = await Video.find(filter)
    .sort(sort)
    .limit(params.limit + 1)
    .lean();

  const hasMore = videos.length > params.limit;
  const page = hasMore ? videos.slice(0, params.limit) : videos;
  const ownerIds = [...new Set(page.map((item) => item.ownerId.toString()))];
  const owners = await User.find({ _id: { $in: ownerIds } }).lean();
  const ownerMap = new Map(owners.map((owner) => [owner._id.toString(), owner]));

  return {
    items: page.map((video) =>
      toPublicVideo(video, ownerMap.get(video.ownerId.toString())),
    ),
    nextCursor: hasMore ? page[page.length - 1]?._id.toString() : null,
  };
}

export async function getVideoByIdOrSlug(
  idOrSlug: string,
  viewerId?: string,
) {
  const query = Types.ObjectId.isValid(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  const video = await Video.findOne(query);
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

  const isOwner = viewerId && video.ownerId.toString() === viewerId;
  if (
    video.visibility === VIDEO_VISIBILITY.PRIVATE &&
    !isOwner
  ) {
    throw new AppError(
      ERROR_CODES.VIDEO_ACCESS_DENIED,
      "You do not have access to this video.",
      403,
    );
  }

  const owner = await User.findById(video.ownerId);
  return toPublicVideo(video, owner);
}

export async function incrementVideoView(videoId: string) {
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
}

export async function getRelatedVideos(videoId: string, category: string) {
  const videos = await Video.find({
    _id: { $ne: videoId },
    category: category as (typeof VIDEO_CATEGORIES)[number],
    visibility: VIDEO_VISIBILITY.PUBLIC,
    processingStatus: VIDEO_PROCESSING_STATUS.READY,
  })
    .sort({ views: -1, createdAt: -1 })
    .limit(10)
    .lean();

  const ownerIds = [...new Set(videos.map((item) => item.ownerId.toString()))];
  const owners = await User.find({ _id: { $in: ownerIds } }).lean();
  const ownerMap = new Map(owners.map((owner) => [owner._id.toString(), owner]));

  return videos.map((video) =>
    toPublicVideo(video, ownerMap.get(video.ownerId.toString())),
  );
}

export async function getOwnerVideos(ownerId: string) {
  const videos = await Video.find({ ownerId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const owner = await User.findById(ownerId);
  return videos.map((video) => toPublicVideo(video, owner));
}

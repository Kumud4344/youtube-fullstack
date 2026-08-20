import { Types } from "mongoose";
import { ERROR_CODES } from "@/constants/errors";
import { AppError } from "@/lib/errors/app-error";
import { Playlist } from "@/models/Playlist";
import { Video } from "@/models/Video";
import type { PublicVideo } from "@/types/video";
import { getVideoByIdOrSlug } from "@/services/video.service";

export type PublicPlaylist = {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  videoCount: number;
  createdAt: string;
  updatedAt: string;
  videos?: PublicVideo[];
};

function toPublicPlaylist(
  playlist: {
    _id: Types.ObjectId;
    title: string;
    description?: string | null;
    visibility: string;
    videos?: Array<{ videoId: Types.ObjectId; position: number }>;
    createdAt: Date;
    updatedAt: Date;
  },
  videos?: PublicVideo[],
): PublicPlaylist {
  return {
    id: playlist._id.toString(),
    title: playlist.title,
    description: playlist.description ?? "",
    visibility: playlist.visibility as "public" | "private",
    videoCount: playlist.videos?.length ?? 0,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
    videos,
  };
}

export async function createPlaylist(params: {
  userId: string;
  title: string;
  description?: string;
  visibility?: "public" | "private";
}) {
  const playlist = await Playlist.create({
    userId: params.userId,
    title: params.title.trim(),
    description: params.description?.trim() ?? "",
    visibility: params.visibility ?? "private",
    videos: [],
  });
  return toPublicPlaylist(playlist);
}

export async function listPlaylists(userId: string) {
  const playlists = await Playlist.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return playlists.map((item) => toPublicPlaylist(item));
}

export async function getPlaylist(params: {
  playlistId: string;
  viewerId?: string;
}) {
  const playlist = await Playlist.findById(params.playlistId);
  if (!playlist) {
    throw AppError.notFound("Playlist not found.");
  }

  const isOwner = params.viewerId === playlist.userId.toString();
  if (playlist.visibility === "private" && !isOwner) {
    throw AppError.forbidden("This playlist is private.");
  }

  const ordered = [...playlist.videos].sort((a, b) => a.position - b.position);
  const videos: PublicVideo[] = [];
  for (const entry of ordered) {
    try {
      videos.push(
        await getVideoByIdOrSlug(entry.videoId.toString(), params.viewerId),
      );
    } catch {
      // skip
    }
  }

  return toPublicPlaylist(playlist, videos);
}

export async function updatePlaylist(params: {
  playlistId: string;
  userId: string;
  title?: string;
  description?: string;
  visibility?: "public" | "private";
}) {
  const playlist = await Playlist.findOne({
    _id: params.playlistId,
    userId: params.userId,
  });
  if (!playlist) throw AppError.notFound("Playlist not found.");

  if (params.title !== undefined) playlist.title = params.title.trim();
  if (params.description !== undefined) {
    playlist.description = params.description.trim();
  }
  if (params.visibility !== undefined) playlist.visibility = params.visibility;
  await playlist.save();
  return toPublicPlaylist(playlist);
}

export async function deletePlaylist(params: {
  playlistId: string;
  userId: string;
}) {
  const result = await Playlist.deleteOne({
    _id: params.playlistId,
    userId: params.userId,
  });
  if (!result.deletedCount) throw AppError.notFound("Playlist not found.");
}

export async function addVideoToPlaylist(params: {
  playlistId: string;
  userId: string;
  videoId: string;
}) {
  const playlist = await Playlist.findOne({
    _id: params.playlistId,
    userId: params.userId,
  });
  if (!playlist) throw AppError.notFound("Playlist not found.");

  const video = await Video.findById(params.videoId);
  if (!video) {
    throw new AppError(ERROR_CODES.VIDEO_NOT_FOUND, "Video not found.", 404);
  }

  if (playlist.videos.some((item) => item.videoId.toString() === params.videoId)) {
    return toPublicPlaylist(playlist);
  }

  playlist.videos.push({
    videoId: new Types.ObjectId(params.videoId),
    position: playlist.videos.length,
    addedAt: new Date(),
  });
  await playlist.save();
  return toPublicPlaylist(playlist);
}

export async function removeVideoFromPlaylist(params: {
  playlistId: string;
  userId: string;
  videoId: string;
}) {
  const playlist = await Playlist.findOne({
    _id: params.playlistId,
    userId: params.userId,
  });
  if (!playlist) throw AppError.notFound("Playlist not found.");

  playlist.videos = playlist.videos.filter(
    (item) => item.videoId.toString() !== params.videoId,
  ) as typeof playlist.videos;

  playlist.videos.forEach((item, index) => {
    item.position = index;
  });
  await playlist.save();
  return toPublicPlaylist(playlist);
}

export async function reorderPlaylistVideos(params: {
  playlistId: string;
  userId: string;
  videoIds: string[];
}) {
  const playlist = await Playlist.findOne({
    _id: params.playlistId,
    userId: params.userId,
  });
  if (!playlist) throw AppError.notFound("Playlist not found.");

  const map = new Map(
    playlist.videos.map((item) => [item.videoId.toString(), item]),
  );

  playlist.videos = params.videoIds
    .map((id, index) => {
      const existing = map.get(id);
      if (!existing) return null;
      existing.position = index;
      return existing;
    })
    .filter(Boolean) as typeof playlist.videos;

  await playlist.save();
  return toPublicPlaylist(playlist);
}

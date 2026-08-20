"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  ListPlus,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { CommentsSection } from "@/components/comments/comments-section";
import { VideoPlayer } from "@/components/player/video-player";
import { VideoCard } from "@/components/video/video-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import type { PublicVideo } from "@/types/video";
import { formatViews, timeAgo } from "@/utils/video";
import { useAuthStore } from "@/stores/auth-store";
import { PLAN_CONFIG } from "@/constants/plans";
import { cn } from "@/utils/cn";

type WatchEntitlement = {
  plan: string;
  watchLimitSeconds: number | null;
  watchedSeconds: number;
  remainingSeconds: number | null;
  limitReached: boolean;
  allowedPositionSeconds: number | null;
};

type WatchResponse = {
  video: PublicVideo;
  related: PublicVideo[];
  viewerReaction: "like" | "dislike" | null;
  isSubscribed: boolean;
  entitlement: WatchEntitlement | null;
  resumePosition: number;
};

type PlaylistItem = {
  id: string;
  title: string;
};

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [limitHitDuringPlayback, setLimitHitDuringPlayback] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["video", params.id],
    queryFn: () => apiFetch<WatchResponse>(`/api/videos/${params.id}`),
  });

  const playlistsQuery = useQuery({
    queryKey: ["playlists"],
    enabled: Boolean(user) && showPlaylists,
    queryFn: () => apiFetch<{ items: PlaylistItem[] }>("/api/playlists"),
  });

  const progressMutation = useMutation({
    mutationFn: (payload: {
      position: number;
      watchedSeconds: number;
      completed: boolean;
    }) =>
      apiFetch(`/api/videos/${params.id}/progress`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "WATCH_LIMIT_REACHED") {
        setLimitHitDuringPlayback(true);
      }
    },
  });

  const reactionMutation = useMutation({
    mutationFn: (type: "like" | "dislike") =>
      apiFetch(`/api/videos/${params.id}/${type}`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["video", params.id] });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const username = data.video.channel.username;
      if (data.isSubscribed) {
        return apiFetch(`/api/channels/${username}/subscribe`, {
          method: "DELETE",
        });
      }
      return apiFetch(`/api/channels/${username}/subscribe`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["video", params.id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (playlistId: string) =>
      apiFetch(`/api/playlists/${playlistId}`, {
        method: "POST",
        body: JSON.stringify({ videoId: params.id }),
      }),
    onSuccess: () => {
      setShowPlaylists(false);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ downloadUrl: string }>(`/api/videos/${params.id}/download`, {
        method: "POST",
      }),
    onSuccess: (result) => {
      setDownloadError(null);
      window.location.href = result.downloadUrl;
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "DOWNLOAD_LIMIT_REACHED") {
        setDownloadError(
          "You have reached today's free download limit. Upgrade to Premium for unlimited downloads.",
        );
        return;
      }
      setDownloadError(
        err instanceof ApiClientError ? err.message : "Download failed.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Unable to load this video.
      </div>
    );
  }

  const { video, related, viewerReaction, isSubscribed, entitlement, resumePosition } =
    data;
  const limitReached =
    Boolean(entitlement?.limitReached) || limitHitDuringPlayback;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] max-w-[1700px] mx-auto">
      <div className="space-y-4">
        <VideoPlayer
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          title={video.title}
          initialTime={resumePosition}
          maxWatchSeconds={entitlement?.allowedPositionSeconds ?? null}
          onLimitReached={() => setLimitHitDuringPlayback(true)}
          onProgress={(payload) => {
            if (!user) return;
            progressMutation.mutate(payload);
          }}
        />

        {limitReached ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <h2 className="text-lg font-bold text-amber-900">
              Watch limit reached
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Your {entitlement?.plan ?? user?.plan ?? "FREE"} plan allows{" "}
              {entitlement?.watchLimitSeconds
                ? `${Math.floor(entitlement.watchLimitSeconds / 60)} minutes`
                : "limited"}{" "}
              per video. Upgrade to keep watching.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(["BRONZE", "SILVER", "GOLD"] as const).map((planId) => {
                const plan = PLAN_CONFIG[planId];
                return (
                  <Link
                    key={planId}
                    href="/pricing"
                    className="rounded-lg border border-amber-200 bg-white p-2.5 text-xs text-[#0f0f0f] hover:border-amber-400"
                  >
                    <span className="font-bold text-[#0f0f0f]">{plan.name}</span>
                    <span className="mt-0.5 block text-[#065fd4]">
                      {plan.priceDisplay} · {plan.watchLimitLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/pricing"
              className="mt-3 inline-flex h-9 items-center rounded-full bg-[#0f0f0f] px-4 text-xs font-semibold text-white"
            >
              Upgrade now
            </Link>
          </div>
        ) : null}

        {/* Video Title */}
        <h1 className="text-xl font-bold text-[#0f0f0f] leading-snug">
          {video.title}
        </h1>

        {/* Channel Info & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e5e5] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/channel/${video.channel.username}`}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cc0000] text-base font-bold text-white uppercase">
                {video.channel.name.slice(0, 1)}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0f0f0f] hover:text-[#0f0f0f]">
                  {video.channel.name}
                </p>
                <p className="text-xs text-[#606060]">
                  @{video.channel.username}
                </p>
              </div>
            </Link>
            {user && user.username !== video.channel.username ? (
              <Button
                variant={isSubscribed ? "secondary" : "primary"}
                size="sm"
                className={cn(
                  "ml-3 rounded-full font-semibold px-4",
                  !isSubscribed && "bg-[#0f0f0f] text-white hover:bg-[#272727]",
                )}
                onClick={() => subscribeMutation.mutate()}
                disabled={subscribeMutation.isPending}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="relative flex flex-wrap items-center gap-2">
            {/* Joined Like / Dislike Pill */}
            <div className="inline-flex items-center rounded-full bg-[#f2f2f2] text-[#0f0f0f]">
              <button
                type="button"
                disabled={!user || reactionMutation.isPending}
                onClick={() => reactionMutation.mutate("like")}
                className={cn(
                  "flex items-center gap-1.5 rounded-l-full px-3.5 py-1.5 text-xs font-semibold hover:bg-[#e5e5e5] transition border-r border-[#d9d9d9]",
                  viewerReaction === "like" && "text-[#065fd4]",
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{video.likesCount}</span>
              </button>
              <button
                type="button"
                disabled={!user || reactionMutation.isPending}
                onClick={() => reactionMutation.mutate("dislike")}
                className={cn(
                  "flex items-center gap-1.5 rounded-r-full px-3 py-1.5 text-xs font-semibold hover:bg-[#e5e5e5] transition",
                  viewerReaction === "dislike" && "text-[#065fd4]",
                )}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{video.dislikesCount || ""}</span>
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                setShareNote("Link copied to clipboard!");
                window.setTimeout(() => setShareNote(null), 2500);
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!user}
              onClick={() => setShowPlaylists((value) => !value)}
            >
              <ListPlus className="h-4 w-4" />
              <span>Save</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!user || downloadMutation.isPending}
              onClick={() => downloadMutation.mutate()}
            >
              <Download className="h-4 w-4" />
              <span>{downloadMutation.isPending ? "Downloading..." : "Download"}</span>
            </Button>

            {shareNote ? (
              <span className="text-xs text-[#065fd4] font-medium">{shareNote}</span>
            ) : null}
            {downloadError ? (
              <div className="basis-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {downloadError}{" "}
                <Link href="/pricing" className="underline font-semibold">
                  Upgrade
                </Link>
              </div>
            ) : null}

            {showPlaylists ? (
              <div className="absolute right-0 top-11 z-30 w-60 rounded-xl border border-[#e5e5e5] bg-white p-3 shadow-lg text-[#0f0f0f]">
                <p className="mb-2 text-xs font-bold text-[#0f0f0f]">Save video to...</p>
                {playlistsQuery.isLoading ? (
                  <Spinner />
                ) : !playlistsQuery.data?.items.length ? (
                  <p className="text-xs text-[#606060]">
                    No playlists yet.{" "}
                    <Link href="/playlists" className="text-[#065fd4] font-semibold">
                      Create one
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {playlistsQuery.data.items.map((playlist) => (
                      <li key={playlist.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[#0f0f0f] hover:bg-[#f2f2f2]"
                          onClick={() => saveMutation.mutate(playlist.id)}
                        >
                          {playlist.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Description Box */}
        <div
          onClick={() => setDescExpanded((v) => !v)}
          className="cursor-pointer rounded-xl bg-[#f2f2f2] p-3 text-sm text-[#0f0f0f] hover:bg-[#e5e5e5] transition"
        >
          <div className="flex gap-2 font-semibold text-xs text-[#0f0f0f]">
            <span>{formatViews(video.views)} views</span>
            <span>·</span>
            <span>{timeAgo(video.createdAt)}</span>
            {video.category ? (
              <>
                <span>·</span>
                <span className="text-[#065fd4]">#{video.category}</span>
              </>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-2 whitespace-pre-wrap text-sm text-[#0f0f0f]",
              !descExpanded && "line-clamp-3",
            )}
          >
            {video.description || "No description provided."}
          </p>
          {video.tags.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {video.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium text-[#065fd4] hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className="mt-2 text-xs font-bold text-[#0f0f0f]"
          >
            {descExpanded ? "Show less" : "...more"}
          </button>
        </div>

        {/* Comments Section */}
        <CommentsSection videoId={video.id} />
      </div>

      {/* Up next / Recommended column */}
      <aside className="space-y-4">
        <h2 className="text-base font-bold text-[#0f0f0f]">Related Videos</h2>
        {related.length === 0 ? (
          <p className="text-sm text-[#606060]">No related videos yet.</p>
        ) : (
          <div className="space-y-3">
            {related.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

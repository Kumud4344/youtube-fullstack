"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicVideo } from "@/types/video";
import { formatDuration, timeAgo } from "@/utils/video";

type HistoryItem = {
  id: string;
  lastPosition: number;
  watchedSeconds: number;
  completed: boolean;
  updatedAt: string;
  video: PublicVideo;
};

export default function HistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ items: HistoryItem[] }>("/api/history"),
  });

  const clearMutation = useMutation({
    mutationFn: (id?: string) =>
      apiFetch(`/api/history${id ? `?id=${id}` : ""}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  if (isLoadingAuth || !user || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">Watch History</h1>
          <p className="mt-1 text-sm text-[#606060]">Videos you have watched across YouTube.</p>
        </div>
        {items.length ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => clearMutation.mutate(undefined)}
          >
            Clear all watch history
          </Button>
        ) : null}
      </div>

      {!items.length ? (
        <EmptyState
          title="No watch history"
          description="Videos you watch will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl p-2 sm:flex-row sm:items-center hover:bg-[#f9f9f9] transition"
            >
              <Link href={`/watch/${item.video.id}`} className="sm:w-56 shrink-0">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-[#e5e5e5]">
                  {item.video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.video.thumbnailUrl}
                      alt={item.video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {formatDuration(item.video.duration)}
                  </span>
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/watch/${item.video.id}`}
                  className="line-clamp-2 text-base font-semibold text-[#0f0f0f] hover:text-[#0f0f0f]"
                >
                  {item.video.title}
                </Link>
                <p className="mt-1 text-xs text-[#606060]">
                  {item.video.channel.name} · {timeAgo(item.updatedAt)}
                </p>
                <p className="text-xs text-[#909090] mt-0.5">
                  Watched {Math.round(item.watchedSeconds)}s · Position{" "}
                  {formatDuration(item.lastPosition)}
                  {item.completed ? " · Completed" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearMutation.mutate(item.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { VideoCard } from "@/components/video/video-card";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicVideo } from "@/types/video";

export default function LikedPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["liked"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ items: PublicVideo[] }>("/api/liked"),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Liked Videos</h1>
        <p className="mt-1 text-sm text-[#606060]">{items.length} videos</p>
      </div>
      {!items.length ? (
        <EmptyState
          title="No liked videos yet."
          description="Use the like button on any video to add it to your liked videos playlist."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {items.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

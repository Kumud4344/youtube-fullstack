"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VideoCard } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { VIDEO_CATEGORIES } from "@/constants/video";
import { apiFetch } from "@/lib/api/client";
import type { PublicVideo } from "@/types/video";
import Link from "next/link";
import { cn } from "@/utils/cn";

type ListResponse = {
  items: PublicVideo[];
  nextCursor: string | null;
};

function BrowseContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["videos", "browse", category, q],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q) params.set("q", q);
      params.set("sort", "latest");
      params.set("limit", "30");
      return apiFetch<ListResponse>(`/api/videos?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Browse Videos</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Discover videos across categories and creators.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Link
          href="/browse"
          className={cn(
            "shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
            !category
              ? "bg-[#0f0f0f] !text-white"
              : "bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]",
          )}
        >
          All
        </Link>
        {VIDEO_CATEGORIES.map((item) => (
          <Link
            key={item}
            href={`/browse?category=${encodeURIComponent(item)}`}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
              category === item
                ? "bg-[#0f0f0f] !text-white"
                : "bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]",
            )}
          >
            {item}
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <EmptyState
          title="Could not load videos"
          description="Please refresh and try again."
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No videos found."
          description="Upload the first video to populate this category."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {data.items.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}

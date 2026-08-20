"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import type { PublicVideo } from "@/types/video";

type ListResponse = {
  items: PublicVideo[];
  nextCursor: string | null;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", q],
    enabled: q.length > 0,
    queryFn: () =>
      apiFetch<ListResponse>(
        `/api/videos?q=${encodeURIComponent(q)}&sort=latest&limit=24`,
      ),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">
          {q ? `Search results for "${q}"` : "Search"}
        </h1>
        <p className="mt-1 text-sm text-[#606060]">
          {q ? `Showing matching videos for your query` : "Enter a search query in the top search bar."}
        </p>
      </div>

      {!q ? (
        <EmptyState
          title="Search YouTube"
          description="Find videos by title, creator, or topic."
        />
      ) : isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <EmptyState
          title="Search failed"
          description="Please try again in a moment."
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No videos found."
          description={`No results found for "${q}". Try different keywords.`}
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

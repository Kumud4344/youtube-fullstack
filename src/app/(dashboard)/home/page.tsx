"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { VideoCard } from "@/components/video/video-card";
import { apiFetch } from "@/lib/api/client";
import type { PublicVideo } from "@/types/video";
import { cn } from "@/utils/cn";

const feedCategories = [
  "All",
  "Music",
  "Gaming",
  "Movies",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
];

type ListResponse = {
  items: PublicVideo[];
  nextCursor: string | null;
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["videos", "home", selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.set("category", selectedCategory);
      }
      params.set("limit", "24");
      params.set("sort", "latest");
      return apiFetch<ListResponse>(`/api/videos?${params.toString()}`);
    },
  });

  const videos = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Category Pills Bar matching screenshot */}
      <div className="sticky top-14 z-30 -mt-2 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-white/95 backdrop-blur-sm flex items-center gap-3 overflow-x-auto no-scrollbar">
        {feedCategories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition cursor-pointer select-none",
                isActive
                  ? "bg-[#0f0f0f] !text-white"
                  : "bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Main Video Feed Area */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : videos.length === 0 ? (
        <div className="py-6">
          <p className="text-base font-normal text-[#0f0f0f]">No videos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

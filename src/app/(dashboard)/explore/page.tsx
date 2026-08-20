"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Film,
  Flame,
  Gamepad2,
  GraduationCap,
  Music2,
  Newspaper,
  Shirt,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { VideoCard } from "@/components/video/video-card";
import { apiFetch } from "@/lib/api/client";
import type { PublicVideo } from "@/types/video";
import { cn } from "@/utils/cn";

const exploreTopics = [
  { id: "All", name: "Trending", icon: Flame, color: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" },
  { id: "Music", name: "Music", icon: Music2, color: "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200" },
  { id: "Gaming", name: "Gaming", icon: Gamepad2, color: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200" },
  { id: "Movies", name: "Movies", icon: Film, color: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" },
  { id: "News", name: "News", icon: Newspaper, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200" },
  { id: "Sports", name: "Sports", icon: Trophy, color: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200" },
  { id: "Fashion", name: "Fashion & Beauty", icon: Shirt, color: "bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-200" },
  { id: "Education", name: "Learning", icon: GraduationCap, color: "bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200" },
  { id: "Technology", name: "Tech & Science", icon: Sparkles, color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200" },
];

type ListResponse = {
  items: PublicVideo[];
  nextCursor: string | null;
};

export default function ExplorePage() {
  const [selectedTopic, setSelectedTopic] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["videos", "explore", selectedTopic],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedTopic !== "All") {
        params.set("category", selectedTopic);
      }
      params.set("sort", "popular");
      params.set("limit", "24");
      return apiFetch<ListResponse>(`/api/videos?${params.toString()}`);
    },
  });

  const videos = data?.items ?? [];

  return (
    <div className="space-y-8">
      {/* Explore Category Cards Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f] tracking-tight">Explore</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Discover what&apos;s trending across gaming, music, movies, news and more.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {exploreTopics.map((topic) => {
          const Icon = topic.icon;
          const isSelected = selectedTopic === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopic(topic.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-2 select-none cursor-pointer",
                isSelected
                  ? "border-[#0f0f0f] bg-[#0f0f0f] !text-white shadow-sm ring-2 ring-[#0f0f0f]/10"
                  : "border-[#e5e5e5] bg-white text-[#0f0f0f] hover:bg-[#f2f2f2]",
              )}
            >
              <div
                className={cn(
                  "p-2.5 rounded-xl transition",
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-[#f2f2f2] text-[#0f0f0f]",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold leading-tight line-clamp-1">
                {topic.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Videos feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-2">
          <Flame className="h-5 w-5 text-[#ff0000]" />
          <h2 className="text-lg font-bold text-[#0f0f0f]">
            {selectedTopic === "All"
              ? "Trending Videos"
              : `Trending in ${exploreTopics.find((t) => t.id === selectedTopic)?.name}`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : videos.length === 0 ? (
          <div className="py-8">
            <p className="text-base font-normal text-[#0f0f0f]">No videos found in this category.</p>
            <p className="mt-1 text-sm text-[#606060]">
              Be the first creator to upload a video in {selectedTopic === "All" ? "any category" : selectedTopic}!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

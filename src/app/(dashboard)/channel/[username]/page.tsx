"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VideoCard } from "@/components/video/video-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import type { PublicVideo } from "@/types/video";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/utils/cn";

type ChannelResponse = {
  channel: {
    id: string;
    name: string;
    username: string;
    bio?: string;
    city?: string;
    state?: string;
    subscriberCount: number;
    videoCount: number;
    isSubscribed: boolean;
    isOwner: boolean;
  };
  videos: PublicVideo[];
};

export default function ChannelPage() {
  const params = useParams<{ username: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["channel", params.username],
    queryFn: () =>
      apiFetch<ChannelResponse>(`/api/channels/${params.username}`),
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!data) return;
      if (data.channel.isSubscribed) {
        return apiFetch(`/api/channels/${params.username}/subscribe`, {
          method: "DELETE",
        });
      }
      return apiFetch(`/api/channels/${params.username}/subscribe`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["channel", params.username],
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Channel not found."
        description="This creator or channel does not exist."
      />
    );
  }

  const { channel, videos } = data;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Channel Header Banner Area */}
      <div className="h-32 sm:h-44 w-full rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 flex items-end p-6" />

      {/* Channel Profile Info Bar */}
      <section className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e5e5e5] pb-6 px-2">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-full bg-[#cc0000] text-3xl sm:text-4xl font-extrabold text-white shadow-md uppercase">
            {channel.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f0f0f]">{channel.name}</h1>
            <p className="text-sm text-[#606060] font-medium">@{channel.username}</p>
            <p className="mt-1 text-xs text-[#606060]">
              {channel.subscriberCount} subscribers · {channel.videoCount} videos
            </p>
            {(channel.city || channel.state) && (
              <p className="text-xs text-[#909090] mt-0.5">
                {[channel.city, channel.state].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="mt-2 max-w-2xl text-xs text-[#606060] line-clamp-2">
              {channel.bio || "No channel bio provided."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && !channel.isOwner ? (
            <Button
              variant={channel.isSubscribed ? "secondary" : "primary"}
              className={cn(
                "rounded-full font-semibold px-6",
                !channel.isSubscribed && "bg-[#0f0f0f] text-white hover:bg-[#272727]",
              )}
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending}
            >
              {channel.isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          ) : null}

          {channel.isOwner ? (
            <Link
              href="/upload"
              className="inline-flex h-9 items-center rounded-full bg-[#0f0f0f] px-5 text-sm font-semibold text-white hover:bg-[#272727] transition"
            >
              Upload video
            </Link>
          ) : null}
        </div>
      </section>

      {/* Channel Videos Feed */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0f0f0f] px-2">Uploaded Videos</h2>
        {!videos.length ? (
          <EmptyState
            title="No videos published yet."
            description="When this creator uploads videos, they will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

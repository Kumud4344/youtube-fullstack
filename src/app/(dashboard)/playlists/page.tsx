"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { VideoCard } from "@/components/video/video-card";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicVideo } from "@/types/video";

type Playlist = {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  videoCount: number;
  videos?: PublicVideo[];
};

export default function PlaylistsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const listQuery = useQuery({
    queryKey: ["playlists"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ items: Playlist[] }>("/api/playlists"),
  });

  const detailQuery = useQuery({
    queryKey: ["playlist", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () =>
      apiFetch<{ playlist: Playlist }>(`/api/playlists/${selectedId}`),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ playlist: Playlist }>("/api/playlists", {
        method: "POST",
        body: JSON.stringify({ title, visibility: "private" }),
      }),
    onSuccess: async (data) => {
      setTitle("");
      setSelectedId(data.playlist.id);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/playlists/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const removeVideoMutation = useMutation({
    mutationFn: (videoId: string) =>
      apiFetch(`/api/playlists/${selectedId}`, {
        method: "POST",
        body: JSON.stringify({ videoId, action: "remove" }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlist", selectedId] });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  if (isLoadingAuth || !user || listQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const playlists = listQuery.data?.items ?? [];
  const selected = detailQuery.data?.playlist;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">Playlists</h1>
          <p className="mt-1 text-sm text-[#606060]">Create and manage playlists.</p>
        </div>

        <form
          className="space-y-3 rounded-2xl border border-[#e5e5e5] bg-white p-3.5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            createMutation.mutate();
          }}
        >
          <Label htmlFor="playlist-title" className="text-xs font-semibold text-[#0f0f0f]">New Playlist</Label>
          <Input
            id="playlist-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Playlist name"
          />
          <Button type="submit" size="sm" className="w-full" disabled={createMutation.isPending}>
            Create Playlist
          </Button>
        </form>

        <ul className="space-y-1">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                type="button"
                onClick={() => setSelectedId(playlist.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  selectedId === playlist.id
                    ? "bg-[#f2f2f2] font-semibold text-[#0f0f0f]"
                    : "text-[#0f0f0f] hover:bg-[#f2f2f2]"
                }`}
              >
                <span className="block font-medium">{playlist.title}</span>
                <span className="text-xs text-[#606060]">
                  {playlist.videoCount} videos · {playlist.visibility}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        {!selectedId ? (
          <EmptyState
            title="Select a playlist"
            description="Choose a playlist on the left or create a new one."
          />
        ) : detailQuery.isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner />
          </div>
        ) : !selected ? (
          <EmptyState title="Playlist not found." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e5e5] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f0f0f]">
                  {selected.title}
                </h2>
                <p className="text-xs text-[#606060]">
                  {selected.description || "No description"} ·{" "}
                  {selected.visibility}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(selected.id)}
              >
                Delete Playlist
              </Button>
            </div>

            {!selected.videos?.length ? (
              <EmptyState
                title="No videos in this playlist."
                description="Save videos from the watch page to see them here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {selected.videos.map((video) => (
                  <div key={video.id} className="space-y-2">
                    <VideoCard video={video} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs w-full text-[#606060]"
                      onClick={() => removeVideoMutation.mutate(video.id)}
                    >
                      Remove from playlist
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

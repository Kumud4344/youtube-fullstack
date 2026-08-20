"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download as DownloadIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { VideoCard } from "@/components/video/video-card";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicVideo } from "@/types/video";

type DownloadItem = {
  id: string;
  downloadedAt: string;
  fileSize: number;
  status: string;
  video: PublicVideo;
};

type Entitlement = {
  plan: string;
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  limitReached: boolean;
  timezone: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["downloads"],
    enabled: Boolean(user),
    queryFn: () =>
      apiFetch<{ items: DownloadItem[]; entitlement: Entitlement }>(
        "/api/downloads",
      ),
  });

  if (isLoadingAuth || !user || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const entitlement = data?.entitlement;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5e5e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">Downloads</h1>
          <p className="mt-1 text-sm text-[#606060]">
            Videos you have downloaded to watch offline.
          </p>
        </div>
        {entitlement ? (
          <div className="rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] px-4 py-2.5 text-xs text-[#0f0f0f]">
            <p className="font-semibold">
              Plan: <span>{entitlement.plan}</span>
            </p>
            <p className="text-[#606060] mt-0.5">
              {entitlement.dailyLimit === null
                ? "Unlimited downloads"
                : `${entitlement.usedToday}/${entitlement.dailyLimit} downloaded today`}
            </p>
            {entitlement.limitReached ? (
              <p className="mt-1 text-[#cc0000] font-semibold">
                Daily download limit reached.{" "}
                <Link href="/pricing" className="underline">
                  Upgrade to Premium
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {!items.length ? (
        <EmptyState
          title="No downloads yet."
          description="Use the Download button on any video watch page to save it for offline watching."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <VideoCard video={item.video} />
              <div className="flex items-center justify-between gap-2 text-xs text-[#606060]">
                <span>{formatBytes(item.fileSize)}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-semibold text-[#065fd4] hover:underline"
                  onClick={async () => {
                    const result = await apiFetch<{ downloadUrl: string }>(
                      `/api/videos/${item.video.id}/download`,
                      { method: "POST" },
                    );
                    window.location.href = result.downloadUrl;
                  }}
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  Download again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

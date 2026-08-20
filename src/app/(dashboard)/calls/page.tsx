"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

type CallItem = {
  id: string;
  callerId: string;
  receiverId: string;
  status: string;
  duration: number;
  createdAt: string;
};

export default function CallsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["calls"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ items: CallItem[] }>("/api/calls"),
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Video Calls</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Recent peer-to-peer video call records.
        </p>
      </div>
      {!items.length ? (
        <EmptyState
          title="No calls yet."
          description="Start a live call with online connections from the Friends page."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-bold text-[#0f0f0f]">
                  {item.callerId === user.id ? "Outgoing Call" : "Incoming Call"} ·{" "}
                  <span className="capitalize font-normal text-[#606060]">{item.status}</span>
                </p>
                <p className="text-xs text-[#606060] mt-0.5">
                  {new Date(item.createdAt).toLocaleString()} · {item.duration}s duration
                </p>
              </div>
              <Link
                href={`/calls/${item.id}`}
                className="rounded-full bg-[#f2f2f2] hover:bg-[#e5e5e5] px-4 py-1.5 text-xs font-semibold text-[#0f0f0f] transition"
              >
                Call Details
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/friends" className="inline-block text-xs font-semibold text-[#065fd4] hover:underline">
        ← Go to Friends
      </Link>
    </div>
  );
}

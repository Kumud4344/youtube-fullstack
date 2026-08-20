"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

export default function SubscriptionPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    enabled: Boolean(user),
    queryFn: () =>
      apiFetch<{
        plan: string;
        planExpiresAt: string | null;
        planConfig: {
          name: string;
          watchLimitLabel: string;
          priceDisplay: string;
        };
        subscription: {
          startedAt: string;
          expiresAt: string;
          status: string;
          price: number;
        } | null;
      }>("/api/subscriptions"),
  });

  if (isLoadingAuth || !user || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Subscriptions & Memberships</h1>
        <p className="mt-1 text-sm text-[#606060]">Your current YouTube Premium membership.</p>
      </div>

      <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#606060]">Current Plan</p>
        <p className="text-3xl font-bold text-[#0f0f0f]">
          {data?.planConfig.name ?? data?.plan}
        </p>
        <p className="text-sm font-medium text-[#065fd4]">
          Watch time: {data?.planConfig.watchLimitLabel}
        </p>
        <p className="text-sm text-[#606060]">
          Price: {data?.planConfig.priceDisplay}
        </p>
        {data?.planExpiresAt ? (
          <p className="text-xs text-[#606060]">
            Expires on {new Date(data.planExpiresAt).toLocaleDateString()}
          </p>
        ) : (
          <p className="text-xs text-[#606060]">Standard unlimited free tier.</p>
        )}
      </div>

      <Link
        href="/pricing"
        className="inline-flex h-10 items-center rounded-full bg-[#0f0f0f] px-5 text-sm font-semibold text-white hover:bg-[#272727] transition"
      >
        Upgrade or change plan
      </Link>
    </div>
  );
}

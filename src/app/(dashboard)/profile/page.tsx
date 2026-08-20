"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { getPlanConfig } from "@/constants/plans";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const plan = getPlanConfig(user.plan);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#cc0000] text-2xl font-bold text-white uppercase">
            {user.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f0f0f]">{user.name}</h1>
            <p className="text-sm text-[#606060]">@{user.username}</p>
            <p className="mt-2 text-xs text-[#606060]">
              {user.bio || "No channel bio yet."}
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/channel/${user.username}`}
                className="inline-flex h-8 items-center rounded-full bg-[#f2f2f2] hover:bg-[#e5e5e5] px-3.5 text-xs font-semibold text-[#0f0f0f]"
              >
                View Channel
              </Link>
              <Link
                href="/settings"
                className="inline-flex h-8 items-center rounded-full bg-[#f2f2f2] hover:bg-[#e5e5e5] px-3.5 text-xs font-semibold text-[#0f0f0f]"
              >
                Edit Settings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#606060]">Premium Plan</p>
          <p className="mt-1 text-lg font-bold text-[#0f0f0f]">{plan.name}</p>
          <p className="text-xs text-[#065fd4] font-medium">{plan.watchLimitLabel} watch time</p>
        </div>
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#606060]">Location</p>
          <p className="mt-1 text-lg font-bold text-[#0f0f0f]">
            {[user.city, user.state].filter(Boolean).join(", ") || "India"}
          </p>
          <p className="text-xs text-[#606060]">{user.country || "IN"}</p>
        </div>
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#606060]">Email</p>
          <p className="mt-1 text-sm font-semibold text-[#0f0f0f]">{user.email}</p>
          <p className="text-xs text-[#606060]">
            {user.emailVerified ? "Verified Account" : "Pending verification"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#606060]">Mobile</p>
          <p className="mt-1 text-sm font-semibold text-[#0f0f0f]">{user.phone || "Not provided"}</p>
          <p className="text-xs text-[#606060]">
            {user.phoneVerified ? "Verified Mobile" : "Not verified"}
          </p>
        </div>
      </section>
    </div>
  );
}

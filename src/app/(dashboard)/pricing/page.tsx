"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PricingPlans } from "@/features/payments/components/pricing-plans";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { UserPlan } from "@/constants/app";

export default function PricingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const subscriptionQuery = useQuery({
    queryKey: ["subscription"],
    enabled: Boolean(user),
    queryFn: () =>
      apiFetch<{ plan: UserPlan; planExpiresAt: string | null }>(
        "/api/subscriptions",
      ),
  });

  useEffect(() => {
    // Pricing is public
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const currentPlan =
    subscriptionQuery.data?.plan ?? user?.plan ?? ("FREE" as UserPlan);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-[#0f0f0f]">YouTube Premium Plans</h1>
        <p className="mt-2 text-sm text-[#606060]">
          Enjoy unlimited watch time, ad-free experience, and offline video downloads.
        </p>
        {user ? (
          <p className="mt-2 text-xs font-semibold text-[#065fd4]">
            Current active tier: {currentPlan}
            {subscriptionQuery.data?.planExpiresAt
              ? ` · Expires on ${new Date(subscriptionQuery.data.planExpiresAt).toLocaleDateString()}`
              : ""}
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#606060]">
            <button
              type="button"
              className="font-semibold text-[#065fd4] hover:underline"
              onClick={() => router.push("/login")}
            >
              Sign in
            </button>{" "}
            to subscribe to YouTube Premium.
          </p>
        )}
      </div>

      <PricingPlans currentPlan={currentPlan} />

      <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#065fd4] border-t border-[#e5e5e5] pt-4">
        <Link href="/payments" className="hover:underline">
          Payment history →
        </Link>
        <Link href="/invoices" className="hover:underline">
          Billing invoices →
        </Link>
        <Link href="/subscription" className="hover:underline">
          Membership details →
        </Link>
      </div>
    </div>
  );
}

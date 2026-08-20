"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { formatInrFromPaise } from "@/lib/payments/invoice-template";

type PaymentItem = {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  razorpayPaymentId?: string;
  createdAt: string;
};

export default function PaymentsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ items: PaymentItem[] }>("/api/payments"),
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
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Payment History</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Review past transactions, charges, and plan activations.
        </p>
      </div>
      {!items.length ? (
        <EmptyState
          title="No payments yet."
          description="Upgrade to YouTube Premium to see transaction history here."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f9f9f9] text-[#606060] border-b border-[#e5e5e5]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[#f0f0f0] hover:bg-[#fafafa]">
                  <td className="px-4 py-3 text-[#606060] text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[#0f0f0f] font-semibold">{item.plan}</td>
                  <td className="px-4 py-3 text-[#0f0f0f] font-bold">
                    {formatInrFromPaise(item.amount)}
                  </td>
                  <td className="px-4 py-3 capitalize text-emerald-600 font-semibold text-xs">
                    {item.status}
                  </td>
                  <td className="px-4 py-3 text-[#909090] text-xs font-mono">
                    {item.razorpayPaymentId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href="/pricing" className="inline-block text-xs font-semibold text-[#065fd4] hover:underline">
        ← Back to Premium Plans
      </Link>
    </div>
  );
}

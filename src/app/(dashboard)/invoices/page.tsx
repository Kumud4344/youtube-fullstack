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

type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  plan: string;
  amount: number;
  issuedAt: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<{ items: InvoiceItem[] }>("/api/invoices"),
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
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Billing Invoices</h1>
        <p className="mt-1 text-sm text-[#606060]">View and download tax invoices for your subscriptions.</p>
      </div>
      {!items.length ? (
        <EmptyState title="No invoices found." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5e5e5] bg-white shadow-sm px-5 py-4"
            >
              <div>
                <p className="font-bold text-sm text-[#0f0f0f]">{item.invoiceNumber}</p>
                <p className="text-xs text-[#606060] mt-0.5">
                  {item.plan} · {formatInrFromPaise(item.amount)} ·{" "}
                  {new Date(item.issuedAt).toLocaleString()}
                </p>
              </div>
              <Link
                href={`/invoices/${item.id}`}
                className="rounded-full bg-[#f2f2f2] hover:bg-[#e5e5e5] px-4 py-1.5 text-xs font-semibold text-[#0f0f0f] transition"
              >
                View Invoice
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

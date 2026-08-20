"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  planName: string;
  amountDisplay: string;
  userName: string;
  userEmail: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  issuedAt: string;
  html: string;
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoice", params.id],
    enabled: Boolean(user),
    queryFn: () =>
      apiFetch<{ invoice: InvoiceDetail }>(`/api/invoices/${params.id}`),
  });

  if (isLoadingAuth || !user || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Invoice not found.
      </div>
    );
  }

  const invoice = data.invoice;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-[#606060]">
            {invoice.planName} · {invoice.amountDisplay} ·{" "}
            {new Date(invoice.issuedAt).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-[#cccccc] bg-white px-4 py-2 text-xs font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2]"
          onClick={() => {
            const blob = new Blob([invoice.html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${invoice.invoiceNumber}.html`;
            anchor.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download HTML
        </button>
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm"
        dangerouslySetInnerHTML={{ __html: invoice.html }}
      />
    </div>
  );
}

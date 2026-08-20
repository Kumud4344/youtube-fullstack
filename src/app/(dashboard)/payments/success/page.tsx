"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function SuccessContent() {
  const params = useSearchParams();
  const invoiceId = params.get("invoiceId");
  const plan = params.get("plan");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
      <h1 className="text-2xl font-bold text-emerald-900">Payment Successful</h1>
      <p className="mt-2 text-sm text-emerald-800">
        Your YouTube Premium <span className="font-bold">{plan ?? "plan"}</span> is now active.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {invoiceId ? (
          <Link
            href={`/invoices/${invoiceId}`}
            className="inline-flex h-9 items-center rounded-full bg-[#0f0f0f] px-5 text-sm font-semibold text-white hover:bg-[#272727] transition"
          >
            View Invoice
          </Link>
        ) : null}
        <Link
          href="/home"
          className="inline-flex h-9 items-center rounded-full border border-[#cccccc] bg-white px-5 text-sm font-semibold text-[#0f0f0f] hover:bg-[#f2f2f2] transition"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

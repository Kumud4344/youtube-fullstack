"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PLAN_CONFIG } from "@/constants/plans";
import type { UserPlan } from "@/constants/app";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/utils/cn";

type OrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: Exclude<UserPlan, "FREE">;
  planName: string;
  isMock: boolean;
  prefill: { name: string; email: string; contact?: string };
};

type VerifyResponse = {
  invoiceId?: string;
  plan: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function PricingPlans({ currentPlan }: { currentPlan?: UserPlan }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const upgradeMutation = useMutation({
    mutationFn: async (plan: Exclude<UserPlan, "FREE">) => {
      setError(null);
      setPendingPlan(plan);
      const order = await apiFetch<OrderResponse>("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });

      if (order.isMock) {
        const paymentId = `pay_mock_${Date.now()}`;
        const signature = `mock_${order.orderId}_${paymentId}`;
        return apiFetch<VerifyResponse>("/api/payments/verify", {
          method: "POST",
          body: JSON.stringify({
            razorpayOrderId: order.orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
          }),
        });
      }

      await new Promise<void>((resolve, reject) => {
        const openCheckout = () => {
          if (!window.Razorpay) {
            reject(new Error("Razorpay SDK failed to load"));
            return;
          }
          const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "YouTube Premium",
            description: `${order.planName} plan upgrade`,
            order_id: order.orderId,
            prefill: order.prefill,
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                const verified = await apiFetch<VerifyResponse>(
                  "/api/payments/verify",
                  {
                    method: "POST",
                    body: JSON.stringify({
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                    }),
                  },
                );
                resolve();
                router.push(
                  `/payments/success?invoiceId=${verified.invoiceId ?? ""}&plan=${verified.plan}`,
                );
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Checkout cancelled")),
            },
          });
          rzp.open();
        };

        if (window.Razorpay) openCheckout();
        else {
          const timer = window.setInterval(() => {
            if (window.Razorpay) {
              window.clearInterval(timer);
              openCheckout();
            }
          }, 200);
          window.setTimeout(() => {
            window.clearInterval(timer);
            reject(new Error("Timed out loading Razorpay"));
          }, 8000);
        }
      });

      return { invoiceId: undefined, plan };
    },
    onSuccess: async (result) => {
      setPendingPlan(null);
      try {
        const me = await apiFetch<{ user: NonNullable<typeof user> }>(
          "/api/auth/me",
        );
        setUser(me.user);
      } catch {
        // ignore
      }
      if (result && "invoiceId" in result) {
        router.push(
          `/payments/success?invoiceId=${result.invoiceId ?? ""}&plan=${result.plan}`,
        );
      }
    },
    onError: (err) => {
      setPendingPlan(null);
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Payment failed",
      );
    },
  });

  return (
    <div className="space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(PLAN_CONFIG).map((plan) => {
          const isGold = plan.id === "GOLD";
          const isCurrent = currentPlan === plan.id;

          return (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col justify-between rounded-2xl border p-6 bg-white shadow-sm transition hover:shadow-md",
                isGold
                  ? "border-[#065fd4] ring-2 ring-[#065fd4]/20"
                  : "border-[#e5e5e5]",
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#606060]">
                    {plan.name}
                  </p>
                  {isGold ? (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#065fd4]">
                      Best Value
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-3xl font-extrabold text-[#0f0f0f]">
                  {plan.priceDisplay}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#065fd4]">
                  Watch time: {plan.watchLimitLabel}
                </p>
                <p className="mt-0.5 text-xs text-[#606060]">
                  Downloads:{" "}
                  {plan.dailyDownloadLimit === null
                    ? "Unlimited"
                    : `${plan.dailyDownloadLimit}/day`}
                </p>
                <ul className="mt-5 space-y-2 text-xs text-[#606060]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#065fd4]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
                <Button
                  className="w-full"
                  variant={isGold ? "primary" : isCurrent ? "outline" : "secondary"}
                  disabled={
                    plan.id === "FREE" ||
                    isCurrent ||
                    !user ||
                    upgradeMutation.isPending
                  }
                  onClick={() => {
                    if (plan.id === "FREE" || isCurrent) return;
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    upgradeMutation.mutate(plan.id);
                  }}
                >
                  {plan.id === "FREE"
                    ? "Free tier"
                    : isCurrent
                      ? "Current plan"
                      : !user
                        ? "Log in to upgrade"
                        : pendingPlan === plan.id
                          ? "Processing…"
                          : "Get Premium"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-[#606060]">
        Secure server-side verification with mock test mode fallback enabled when test keys are active.
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicUser } from "@/types/api";

const otpFormSchema = z.object({
  otp: z.string().trim().regex(/^\d{4,8}$/, "Enter a valid OTP"),
});

type OtpFormValues = z.infer<typeof otpFormSchema>;

type Challenge = {
  challengeId: string;
  channel: string;
  destinationHint: string;
  debugOtp?: string;
  purpose: string;
};

function readChallenge(): Challenge | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("vidora_otp_challenge");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Challenge;
  } catch {
    return null;
  }
}

export function VerifyOtpForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [mounted, setMounted] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    setMounted(true);
    const initialChallenge = readChallenge();
    setChallenge(initialChallenge);
    if (initialChallenge?.debugOtp) {
      setValue("otp", initialChallenge.debugOtp);
    }
  }, [setValue]);

  if (!mounted) {
    return (
      <Card className="w-full max-w-md p-6 flex min-h-[220px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className="w-full max-w-md p-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Session Expired</CardTitle>
          <CardDescription className="text-sm">
            Please sign in or register again to receive a new OTP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#0f0f0f] px-5 text-sm font-semibold text-white hover:bg-[#272727]"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  const activeChallenge = challenge;

  async function onSubmit(values: OtpFormValues) {
    setError(null);
    setInfo(null);
    try {
      const data = await apiFetch<{ user: PublicUser }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          challengeId: activeChallenge.challengeId,
          otp: values.otp,
        }),
      });
      sessionStorage.removeItem("vidora_otp_challenge");
      setUser(data.user);
      router.push("/home");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "OTP verification failed.",
      );
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      const data = await apiFetch<{
        challengeId: string;
        channel: string;
        destinationHint: string;
        debugOtp?: string;
        expiresAt: string;
      }>("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ challengeId: activeChallenge.challengeId }),
      });

      const nextChallenge: Challenge = {
        purpose: activeChallenge.purpose,
        challengeId: data.challengeId,
        channel: data.channel,
        destinationHint: data.destinationHint,
        debugOtp: data.debugOtp,
      };
      sessionStorage.setItem(
        "vidora_otp_challenge",
        JSON.stringify(nextChallenge),
      );
      setChallenge(nextChallenge);
      if (data.debugOtp) {
        setValue("otp", data.debugOtp);
      }
      setInfo("A new verification code has been sent.");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not resend OTP.",
      );
    }
  }

  return (
    <Card className="w-full max-w-md p-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">2-Step Verification</CardTitle>
        <CardDescription className="text-sm">
          A verification code was sent via {activeChallenge.channel.toLowerCase()} to{" "}
          <span className="font-semibold text-[#0f0f0f]">
            {activeChallenge.destinationHint}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Local Development OTP Display Box */}
        {activeChallenge.debugOtp ? (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                <KeyRound className="h-3 w-3" />
                Local Test OTP
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-bold text-[#065fd4] hover:underline cursor-pointer"
                onClick={() => setValue("otp", activeChallenge.debugOtp!)}
              >
                <Sparkles className="h-3 w-3" />
                Auto-fill
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-800 font-medium">Your verification code:</span>
              <span className="bg-white border border-amber-300 px-2.5 py-0.5 rounded-md text-base font-mono font-extrabold text-[#0f0f0f] tracking-widest select-all">
                {activeChallenge.debugOtp}
              </span>
            </div>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="otp" className="text-xs font-bold text-[#0f0f0f]">Enter code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="mt-1 tracking-widest text-center text-lg font-mono font-bold"
              {...register("otp")}
            />
            {errors.otp ? (
              <p className="mt-1 text-xs text-[#cc0000]">{errors.otp.message}</p>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          ) : null}
          {info ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              {info}
            </div>
          ) : null}

          <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Verify & Continue
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs">
          <button
            type="button"
            className="font-semibold text-[#065fd4] hover:underline cursor-pointer"
            onClick={() => void resend()}
          >
            Resend code
          </button>
          <Link href="/login" className="text-[#606060] hover:underline">
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

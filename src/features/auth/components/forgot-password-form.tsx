"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas";
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

type FormValues = ForgotPasswordInput;

type ForgotPasswordResponse = {
  accepted: boolean;
  exists?: boolean;
  challengeId?: string;
  channel?: string;
  destinationHint?: string;
  debugOtp?: string;
};

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<{
    otp?: string;
    challengeId?: string;
    exists?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);
    setOtpInfo(null);
    try {
      const data = await apiFetch<ForgotPasswordResponse>(
        "/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify(values),
        },
      );

      if (data.exists === false) {
        setSuccess("No user account exists with this email.");
        return;
      }

      if (data.challengeId) {
        sessionStorage.setItem(
          "vidora_otp_challenge",
          JSON.stringify({
            challengeId: data.challengeId,
            channel: data.channel ?? "EMAIL",
            destinationHint: data.destinationHint ?? values.email,
            debugOtp: data.debugOtp,
            purpose: "RESET_PASSWORD",
          }),
        );

        setOtpInfo({
          otp: data.debugOtp,
          challengeId: data.challengeId,
          exists: true,
        });

        setSuccess("Account found! Password recovery OTP has been generated.");
      } else {
        setSuccess(
          "If an account exists for that email, a reset code has been sent.",
        );
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to process request.",
      );
    }
  }

  return (
    <Card className="w-full max-w-md p-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Account recovery</CardTitle>
        <CardDescription className="text-sm">
          Enter your account email to recover your YouTube account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Local Test OTP Display Banner */}
        {otpInfo?.otp ? (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                <KeyRound className="h-3 w-3" />
                Local Test OTP
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                User Verified
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-800 font-medium">Your recovery OTP:</span>
              <span className="bg-white border border-amber-300 px-2.5 py-0.5 rounded-md text-base font-mono font-extrabold text-[#0f0f0f] tracking-widest select-all">
                {otpInfo.otp}
              </span>
            </div>

            <Button
              type="button"
              className="w-full h-8 text-xs font-semibold rounded-full bg-[#0f0f0f] text-white hover:bg-[#272727] flex items-center justify-center gap-1.5"
              onClick={() => router.push("/verify-otp")}
            >
              Verify OTP Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="email" className="text-xs font-bold text-[#0f0f0f]">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" className="mt-1" {...register("email")} />
            {errors.email ? (
              <p className="mt-1 text-xs text-[#cc0000]">{errors.email.message}</p>
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
          {success && !otpInfo?.otp ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              {success}
            </div>
          ) : null}

          <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Send recovery code
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-[#606060]">
          <Link href="/login" className="font-semibold text-[#065fd4] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

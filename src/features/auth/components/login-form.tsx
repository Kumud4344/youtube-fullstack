"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
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

type LoginResponse = {
  requiresOtp: true;
  user: { id: string; email: string; username: string; state?: string };
  otp: {
    challengeId: string;
    channel: string;
    destinationHint: string;
    expiresAt: string;
  };
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      sessionStorage.setItem(
        "vidora_otp_challenge",
        JSON.stringify({
          challengeId: data.otp.challengeId,
          channel: data.otp.channel,
          destinationHint: data.otp.destinationHint,
          debugOtp: (data.otp as { debugOtp?: string }).debugOtp,
          purpose: "LOGIN",
        }),
      );

      router.push("/verify-otp");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Login failed. Please try again.",
      );
    }
  }

  return (
    <Card className="w-full max-w-md p-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription className="text-sm">
          to continue to YouTube
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="identifier" className="text-xs font-bold text-[#0f0f0f]">Email or username</Label>
            <Input
              id="identifier"
              autoComplete="username"
              placeholder="Enter email or @username"
              className="mt-1"
              {...register("identifier")}
            />
            {errors.identifier ? (
              <p className="mt-1 text-xs text-[#cc0000]">
                {errors.identifier.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-bold text-[#0f0f0f]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              className="mt-1"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-[#cc0000]">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#065fd4] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Next
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-[#606060]">
          Not your computer? Use Guest mode to sign in privately.{" "}
          <Link href="/register" className="font-semibold text-[#065fd4] hover:underline block mt-2">
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

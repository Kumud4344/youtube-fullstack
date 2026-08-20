"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
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
import type { PublicUser } from "@/types/api";

type RegisterResponse = {
  user: PublicUser;
  otp: {
    challengeId: string;
    channel: string;
    destinationHint: string;
    expiresAt: string;
  };
};

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      city: "",
      state: "",
      country: "India",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    try {
      const data = await apiFetch<RegisterResponse>("/api/auth/register", {
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
          purpose: "REGISTER",
        }),
      );

      router.push("/verify-otp");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Registration failed. Please try again.",
      );
    }
  }

  return (
    <Card className="w-full max-w-lg p-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create your Google Account</CardTitle>
        <CardDescription className="text-sm">
          to start watching and uploading to YouTube
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-xs font-bold text-[#0f0f0f]">Full name</Label>
              <Input id="name" autoComplete="name" placeholder="John Doe" className="mt-1" {...register("name")} />
              {errors.name ? (
                <p className="mt-1 text-xs text-[#cc0000]">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="username" className="text-xs font-bold text-[#0f0f0f]">Username</Label>
              <Input id="username" autoComplete="username" placeholder="johndoe" className="mt-1" {...register("username")} />
              {errors.username ? (
                <p className="mt-1 text-xs text-[#cc0000]">
                  {errors.username.message}
                </p>
              ) : null}
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-xs font-bold text-[#0f0f0f]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              autoComplete="email"
              className="mt-1"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-[#cc0000]">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs font-bold text-[#0f0f0f]">Phone (optional/region OTP)</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+919876543210"
              className="mt-1"
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-[#cc0000]">{errors.phone.message}</p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="city" className="text-xs font-bold text-[#0f0f0f]">City</Label>
              <Input id="city" placeholder="Bangalore" className="mt-1" {...register("city")} />
            </div>
            <div>
              <Label htmlFor="state" className="text-xs font-bold text-[#0f0f0f]">State</Label>
              <Input id="state" placeholder="Karnataka" className="mt-1" {...register("state")} />
            </div>
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-bold text-[#0f0f0f]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create strong password"
              autoComplete="new-password"
              className="mt-1"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-[#cc0000]">
                {errors.password.message}
              </p>
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

          <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Create account
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-[#606060]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#065fd4] hover:underline">
            Sign in instead
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

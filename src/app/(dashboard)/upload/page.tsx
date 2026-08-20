"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadVideoForm } from "@/features/videos/components/upload-video-form";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

export default function UploadPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Upload Video</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Add video details, configure thumbnail, and publish to YouTube.
        </p>
      </div>
      <UploadVideoForm />
    </div>
  );
}

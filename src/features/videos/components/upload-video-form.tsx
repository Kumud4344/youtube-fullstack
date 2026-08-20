"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, X } from "lucide-react";
import { z } from "zod";
import {
  VIDEO_CATEGORIES,
  VIDEO_UPLOAD_LIMITS,
  VIDEO_VISIBILITY,
} from "@/constants/video";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { PublicVideo } from "@/types/video";
import { ApiClientError } from "@/lib/api/client";

const uploadFormSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).optional(),
  category: z.enum(VIDEO_CATEGORIES),
  tags: z.string().optional(),
  visibility: z.enum([
    VIDEO_VISIBILITY.PUBLIC,
    VIDEO_VISIBILITY.PRIVATE,
    VIDEO_VISIBILITY.UNLISTED,
  ]),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

type UploadPhase =
  | "idle"
  | "preparing"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export function UploadVideoForm() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<PublicVideo | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const previewUrl = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : null),
    [videoFile],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Other",
      tags: "",
      visibility: VIDEO_VISIBILITY.PUBLIC,
    },
  });

  function validateAndSetVideo(file: File | null) {
    setError(null);
    if (!file) {
      setVideoFile(null);
      return;
    }
    if (
      !VIDEO_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as never)
    ) {
      setError("Unsupported video type. Use MP4, WebM, MOV, or MKV.");
      return;
    }
    if (file.size > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      setError("Video exceeds the 500MB upload limit.");
      return;
    }
    setVideoFile(file);
    setPhase("idle");
  }

  async function onSubmit(values: UploadFormValues) {
    if (!videoFile) {
      setError("Select a video file to upload.");
      return;
    }

    setError(null);
    setPhase("preparing");
    setProgress(5);

    const form = new FormData();
    form.append("video", videoFile);
    if (thumbnailFile) form.append("thumbnail", thumbnailFile);
    form.append("title", values.title);
    form.append("description", values.description ?? "");
    form.append("category", values.category);
    form.append("tags", values.tags ?? "");
    form.append("visibility", values.visibility);

    try {
      setPhase("uploading");
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.src = URL.createObjectURL(videoFile);
      const duration = await new Promise<number>((resolve) => {
        videoEl.onloadedmetadata = () => {
          resolve(Number.isFinite(videoEl.duration) ? videoEl.duration : 0);
          URL.revokeObjectURL(videoEl.src);
        };
        videoEl.onerror = () => resolve(0);
      });
      form.append("duration", String(Math.round(duration)));

      const data = await new Promise<{ video: PublicVideo }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/videos");
        xhr.withCredentials = true;
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const pct = Math.round((event.loaded / event.total) * 90) + 5;
          setProgress(pct);
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText) as {
              success: boolean;
              data?: { video: PublicVideo };
              error?: { code: string; message: string };
            };
            if (!json.success || !json.data) {
              reject(
                new ApiClientError(
                  json.error?.code ?? "UPLOAD_FAILED",
                  json.error?.message ?? "Upload failed",
                  xhr.status,
                ),
              );
              return;
            }
            resolve(json.data);
          } catch {
            reject(new Error("Invalid upload response"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(form);
      });

      setPhase("processing");
      setProgress(98);
      setUploaded(data.video);
      setPhase("completed");
      setProgress(100);
    } catch (err) {
      setPhase("failed");
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed.",
      );
    }
  }

  if (phase === "completed" && uploaded) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-emerald-900">Upload Complete</h2>
        <p className="mt-2 text-sm text-emerald-800">
          “{uploaded.title}” is uploaded and ready to watch.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push(`/watch/${uploaded.id}`)}>
            Watch Video
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setUploaded(null);
              setVideoFile(null);
              setThumbnailFile(null);
              setPhase("idle");
              setProgress(0);
              reset();
            }}
          >
            Upload Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit(onSubmit)}>
      <section className="space-y-4">
        <div
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition bg-white shadow-sm ${
            dragOver
              ? "border-[#065fd4] bg-blue-50/50"
              : "border-[#cccccc] hover:border-[#999999]"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            validateAndSetVideo(file);
          }}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-[#606060]" />
          <p className="mt-3 text-base font-bold text-[#0f0f0f]">
            Drag and drop video files to upload
          </p>
          <p className="mt-1 text-xs text-[#606060]">
            Your videos will be private until you publish them.
          </p>
          <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#0f0f0f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#272727] transition">
            Select files
            <input
              type="file"
              accept={VIDEO_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.join(",")}
              className="hidden"
              onChange={(event) =>
                validateAndSetVideo(event.target.files?.[0] ?? null)
              }
            />
          </label>
          {videoFile ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#f2f2f2] p-2 text-xs font-semibold text-[#0f0f0f]">
              <span className="truncate">{videoFile.name}</span>
              <button
                type="button"
                aria-label="Remove video"
                onClick={() => setVideoFile(null)}
                className="text-[#606060] hover:text-[#0f0f0f]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {previewUrl ? (
          <video
            src={previewUrl}
            controls
            className="aspect-video w-full rounded-2xl border border-[#e5e5e5] bg-black"
          />
        ) : null}

        {(phase === "uploading" || phase === "preparing" || phase === "processing") && (
          <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#0f0f0f]">
              <span className="capitalize">{phase}…</span>
              <span className="text-[#065fd4]">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f2f2f2]">
              <div
                className="h-full bg-[#065fd4] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
        <div>
          <Label htmlFor="title" className="text-xs font-bold text-[#0f0f0f]">Title (required)</Label>
          <Input id="title" placeholder="Add a title that describes your video" {...register("title")} className="mt-1.5" />
          {errors.title ? (
            <p className="mt-1 text-xs text-[#cc0000]">{errors.title.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="description" className="text-xs font-bold text-[#0f0f0f]">Description</Label>
          <textarea
            id="description"
            rows={4}
            placeholder="Tell viewers about your video"
            className="mt-1.5 w-full rounded-lg border border-[#cccccc] bg-white px-3 py-2 text-sm text-[#0f0f0f] placeholder-[#888888] focus:border-[#065fd4] focus:outline-none focus:ring-1 focus:ring-[#065fd4]"
            {...register("description")}
          />
        </div>
        <div>
          <Label htmlFor="category" className="text-xs font-bold text-[#0f0f0f]">Category</Label>
          <select
            id="category"
            className="mt-1.5 h-10 w-full rounded-lg border border-[#cccccc] bg-white px-3 text-sm text-[#0f0f0f]"
            {...register("category")}
          >
            {VIDEO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="tags" className="text-xs font-bold text-[#0f0f0f]">Tags (comma separated)</Label>
          <Input id="tags" placeholder="gaming, music, tech, tutorial" {...register("tags")} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="visibility" className="text-xs font-bold text-[#0f0f0f]">Visibility</Label>
          <select
            id="visibility"
            className="mt-1.5 h-10 w-full rounded-lg border border-[#cccccc] bg-white px-3 text-sm text-[#0f0f0f]"
            {...register("visibility")}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <Label htmlFor="thumbnail" className="text-xs font-bold text-[#0f0f0f]">Thumbnail (optional)</Label>
          <Input
            id="thumbnail"
            type="file"
            accept={VIDEO_UPLOAD_LIMITS.ALLOWED_THUMBNAIL_MIME_TYPES.join(",")}
            onChange={(event) =>
              setThumbnailFile(event.target.files?.[0] ?? null)
            }
            className="mt-1.5"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-medium"
          >
            {error}
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1 font-semibold"
            disabled={
              phase === "uploading" ||
              phase === "preparing" ||
              phase === "processing"
            }
          >
            {phase === "uploading" || phase === "preparing" ? (
              <Spinner />
            ) : null}
            Publish
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setVideoFile(null);
              setThumbnailFile(null);
              setPhase("idle");
              setProgress(0);
              setError(null);
              reset();
            }}
          >
            Cancel
          </Button>
        </div>
      </section>
    </form>
  );
}

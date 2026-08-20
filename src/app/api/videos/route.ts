import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { AppError } from "@/lib/errors/app-error";
import {
  assertValidThumbnailFile,
  assertValidVideoFile,
  videoListQuerySchema,
  videoMetadataSchema,
} from "@/features/videos/schemas";
import { createVideoUpload, listVideos } from "@/services/video.service";
import { getSessionFromCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = videoListQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });

    const session = await getSessionFromCookies();
    const result = await withDb(() =>
      listVideos({
        ...query,
        viewerId: session?.sub,
      }),
    );

    return apiSuccess(result, "Videos fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const form = await request.formData();
    const videoFile = form.get("video");
    const thumbnailFile = form.get("thumbnail");

    if (!(videoFile instanceof File)) {
      throw AppError.validation("A video file is required.");
    }

    try {
      assertValidVideoFile(videoFile);
    } catch (error) {
      throw AppError.validation(
        error instanceof Error ? error.message : "Invalid video file.",
      );
    }

    if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      try {
        assertValidThumbnailFile(thumbnailFile);
      } catch (error) {
        throw AppError.validation(
          error instanceof Error ? error.message : "Invalid thumbnail.",
        );
      }
    }

    const rawTags = form.get("tags");
    const metadata = videoMetadataSchema.parse({
      title: form.get("title"),
      description: form.get("description") ?? "",
      category: form.get("category") ?? "Other",
      tags: typeof rawTags === "string" ? rawTags : [],
      visibility: form.get("visibility") ?? "public",
      duration: form.get("duration") ?? undefined,
    });

    const video = await withDb(() =>
      createVideoUpload({
        ownerId: session.sub,
        metadata,
        videoFile,
        thumbnailFile:
          thumbnailFile instanceof File && thumbnailFile.size > 0
            ? thumbnailFile
            : null,
      }),
    );

    return apiSuccess({ video }, "Video uploaded successfully.", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

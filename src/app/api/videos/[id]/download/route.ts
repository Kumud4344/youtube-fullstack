import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { createDownloadToken } from "@/lib/downloads/signed-url";
import { getEnv } from "@/lib/env";
import { createVideoDownload } from "@/services/download.service";

type Params = { params: Promise<{ id: string }> };

function safeFileName(title: string, mimeType: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const ext =
    mimeType === "video/webm"
      ? ".webm"
      : mimeType === "video/quicktime"
        ? ".mov"
        : ".mp4";
  return `${base || "vidora-video"}${ext}`;
}

async function authorizeDownload(userId: string, videoId: string) {
  const result = await createVideoDownload({ userId, videoId });
  const fileName = safeFileName(result.download.title, result.download.mimeType);
  const token = createDownloadToken({
    downloadId: result.download.id,
    userId,
    videoId: result.download.videoId,
    storageKey: result.download.storageKey,
    fileName,
    mimeType: result.download.mimeType,
  });
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const downloadUrl = `${appUrl}/api/downloads/stream?token=${encodeURIComponent(token)}`;

  return {
    download: {
      id: result.download.id,
      videoId: result.download.videoId,
      fileSize: result.download.fileSize,
      downloadedAt: result.download.downloadedAt,
      status: result.download.status,
    },
    downloadUrl,
    entitlement: result.entitlement,
  };
}

/**
 * Authenticated download:
 * 1) checks entitlement
 * 2) records download
 * 3) returns a short-lived signed stream URL (no raw filesystem paths)
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const payload = await withDb(() => authorizeDownload(session.sub, id));
    return apiSuccess(payload, "Download authorized.");
  } catch (error) {
    return handleRouteError(error);
  }
}

/** GET with JSON accept returns payload; otherwise redirects to signed stream. */
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const payload = await withDb(() => authorizeDownload(session.sub, id));

    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("application/json")) {
      return apiSuccess(payload, "Download authorized.");
    }

    return Response.redirect(payload.downloadUrl, 302);
  } catch (error) {
    return handleRouteError(error);
  }
}

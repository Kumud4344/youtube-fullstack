import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { apiError } from "@/lib/api/response";
import { ERROR_CODES } from "@/constants/errors";
import { verifyDownloadToken } from "@/lib/downloads/signed-url";
import { getVideoStorage } from "@/lib/storage/local";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return apiError(ERROR_CODES.AUTH_REQUIRED, "Download token required.", 401);
    }

    let payload;
    try {
      payload = verifyDownloadToken(token);
    } catch {
      return apiError(
        ERROR_CODES.FORBIDDEN,
        "Download link is invalid or expired.",
        403,
      );
    }

    const storage = getVideoStorage();
    const absolute = storage.resolveAbsolutePath(payload.storageKey);
    if (!existsSync(absolute)) {
      return apiError(ERROR_CODES.NOT_FOUND, "Media file not found.", 404);
    }

    const stat = statSync(absolute);
    const stream = createReadStream(absolute);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": payload.mimeType || "application/octet-stream",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${payload.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("Download stream failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      ERROR_CODES.INTERNAL_ERROR,
      "Unable to download file.",
      500,
    );
  }
}

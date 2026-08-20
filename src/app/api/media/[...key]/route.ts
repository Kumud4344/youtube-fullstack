import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { getVideoStorage } from "@/lib/storage/local";
import { apiError } from "@/lib/api/response";
import { ERROR_CODES } from "@/constants/errors";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ key: string[] }> };

function contentTypeFromKey(key: string): string {
  if (key.endsWith(".webm")) return "video/webm";
  if (key.endsWith(".mov")) return "video/quicktime";
  if (key.endsWith(".mkv")) return "video/x-matroska";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  return "video/mp4";
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { key: parts } = await params;
    const key = parts.join("/");
    const storage = getVideoStorage();
    const absolute = storage.resolveAbsolutePath(key);

    if (!existsSync(absolute)) {
      return apiError(ERROR_CODES.NOT_FOUND, "Media not found.", 404);
    }

    const stat = statSync(absolute);
    const range = request.headers.get("range");
    const contentType = contentTypeFromKey(key);
    const download = new URL(request.url).searchParams.get("download") === "1";

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (!match) {
        return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid range.", 416);
      }
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : Math.min(start + 10 ** 6, stat.size - 1);
      if (start >= stat.size || end >= stat.size) {
        return apiError(ERROR_CODES.VALIDATION_ERROR, "Invalid range.", 416);
      }

      const stream = createReadStream(absolute, { start, end });
      const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(end - start + 1),
          "Content-Type": contentType,
          ...(download
            ? { "Content-Disposition": `attachment; filename="${parts.at(-1)}"` }
            : {}),
        },
      });
    }

    const stream = createReadStream(absolute);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Length": String(stat.size),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        ...(download
          ? { "Content-Disposition": `attachment; filename="${parts.at(-1)}"` }
          : {}),
      },
    });
  } catch (error) {
    logger.error("Media stream failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(ERROR_CODES.INTERNAL_ERROR, "Unable to stream media.", 500);
  }
}

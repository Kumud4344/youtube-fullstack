import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type {
  StoredVideo,
  UploadMetadata,
  VideoStorageService,
} from "@/lib/storage/types";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export class LocalVideoStorageService implements VideoStorageService {
  private root: string;

  constructor(root = STORAGE_ROOT) {
    this.root = root;
  }

  async upload(file: Buffer, metadata: UploadMetadata): Promise<StoredVideo> {
    const ext = path.extname(metadata.filename) || guessExtension(metadata.mimeType);
    const key = `videos/${metadata.ownerId}/${nanoid(16)}${ext}`;
    const absolute = path.join(this.root, key);
    await ensureDir(path.dirname(absolute));
    await fs.writeFile(absolute, file);

    return {
      key,
      url: `/api/media/${key}`,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };
  }

  async uploadThumbnail(
    file: Buffer,
    metadata: Omit<UploadMetadata, "mimeType"> & { mimeType: string },
  ): Promise<StoredVideo> {
    const ext = path.extname(metadata.filename) || ".jpg";
    const key = `thumbnails/${metadata.ownerId}/${nanoid(12)}${ext}`;
    const absolute = path.join(this.root, key);
    await ensureDir(path.dirname(absolute));
    await fs.writeFile(absolute, file);

    return {
      key,
      url: `/api/media/${key}`,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };
  }

  async getPlaybackUrl(videoKey: string): Promise<string> {
    return `/api/media/${videoKey}`;
  }

  async getDownloadUrl(videoKey: string): Promise<string> {
    return `/api/media/${videoKey}?download=1`;
  }

  async delete(videoKey: string): Promise<void> {
    const absolute = path.join(this.root, videoKey);
    await fs.unlink(absolute).catch(() => undefined);
  }

  resolveAbsolutePath(key: string): string {
    const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    const absolute = path.join(this.root, normalized);
    if (!absolute.startsWith(this.root)) {
      throw new Error("Invalid storage key");
    }
    return absolute;
  }
}

function guessExtension(mimeType: string): string {
  switch (mimeType) {
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    case "video/x-matroska":
      return ".mkv";
    default:
      return ".mp4";
  }
}

let cached: LocalVideoStorageService | null = null;

export function getVideoStorage(): LocalVideoStorageService {
  const driver = process.env.VIDEO_STORAGE_DRIVER ?? "local";
  if (driver !== "local") {
    // Future: return S3/R2 drivers. Local remains the Phase 2 default.
  }
  if (!cached) {
    cached = new LocalVideoStorageService();
  }
  return cached;
}

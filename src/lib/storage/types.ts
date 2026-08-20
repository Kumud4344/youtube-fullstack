/**
 * Storage abstraction foundation for Phase 2+.
 * Local filesystem is one driver; S3/R2 can be added without rewriting callers.
 */
export type UploadMetadata = {
  filename: string;
  mimeType: string;
  ownerId: string;
  size: number;
};

export type StoredVideo = {
  key: string;
  url: string;
  size: number;
  mimeType: string;
};

export interface VideoStorageService {
  upload(file: Buffer, metadata: UploadMetadata): Promise<StoredVideo>;
  getPlaybackUrl(videoKey: string): Promise<string>;
  getDownloadUrl(videoKey: string): Promise<string>;
  delete(videoKey: string): Promise<void>;
}

import { describe, expect, it } from "vitest";
import {
  assertValidThumbnailFile,
  assertValidVideoFile,
} from "@/features/videos/schemas";
import { slugify } from "@/utils/video";

function fakeFile(name: string, type: string, size: number): File {
  const buffer = new Uint8Array(Math.min(size, 16));
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

describe("video upload validation", () => {
  it("accepts supported video files", () => {
    expect(() =>
      assertValidVideoFile(fakeFile("clip.mp4", "video/mp4", 1024)),
    ).not.toThrow();
  });

  it("rejects unsupported extensions and empty files", () => {
    expect(() =>
      assertValidVideoFile(fakeFile("notes.txt", "text/plain", 10)),
    ).toThrow(/Unsupported video type/);
    expect(() =>
      assertValidVideoFile(fakeFile("clip.mp4", "video/mp4", 0)),
    ).toThrow(/empty/);
  });

  it("validates thumbnails", () => {
    expect(() =>
      assertValidThumbnailFile(fakeFile("thumb.jpg", "image/jpeg", 1024)),
    ).not.toThrow();
    expect(() =>
      assertValidThumbnailFile(fakeFile("thumb.gif", "image/gif", 1024)),
    ).toThrow(/Thumbnail must be/);
  });
});

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("Hello Vidora World!")).toBe("hello-vidora-world");
    expect(slugify("  React & Next.js  ")).toBe("react-nextjs");
  });
});

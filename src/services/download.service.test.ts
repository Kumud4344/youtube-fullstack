import { describe, expect, it } from "vitest";
import { getDailyDownloadLimit } from "@/constants/plans";
import { getDayRangeForTimezone } from "@/lib/time/timezone";
import { ERROR_CODES } from "@/constants/errors";

describe("download entitlements", () => {
  it("allows one free download per day and unlimited premium", () => {
    expect(getDailyDownloadLimit("FREE")).toBe(1);
    expect(getDailyDownloadLimit("BRONZE")).toBeNull();
    expect(getDailyDownloadLimit("SILVER")).toBeNull();
    expect(getDailyDownloadLimit("GOLD")).toBeNull();
  });

  it("exposes DOWNLOAD_LIMIT_REACHED error code", () => {
    expect(ERROR_CODES.DOWNLOAD_LIMIT_REACHED).toBe("DOWNLOAD_LIMIT_REACHED");
  });
});

describe("timezone day bounds", () => {
  it("returns IST day window for a known UTC instant", () => {
    // 2026-08-13 22:30 UTC = 2026-08-14 04:00 IST
    const now = new Date("2026-08-13T22:30:00.000Z");
    const range = getDayRangeForTimezone("Asia/Kolkata", now);
    expect(range.dayKey).toBe("2026-08-14");
    expect(range.end.getTime() - range.start.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(now.getTime()).toBeGreaterThanOrEqual(range.start.getTime());
    expect(now.getTime()).toBeLessThan(range.end.getTime());
  });
});

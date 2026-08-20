import { describe, expect, it } from "vitest";
import {
  getDailyDownloadLimit,
  getWatchLimitSeconds,
  isUnlimitedWatch,
  PLAN_CONFIG,
} from "@/constants/plans";

describe("PLAN_CONFIG", () => {
  it("defines Free/Bronze/Silver/Gold watch limits", () => {
    expect(getWatchLimitSeconds("FREE")).toBe(5 * 60);
    expect(getWatchLimitSeconds("BRONZE")).toBe(7 * 60);
    expect(getWatchLimitSeconds("SILVER")).toBe(10 * 60);
    expect(getWatchLimitSeconds("GOLD")).toBeNull();
    expect(isUnlimitedWatch("GOLD")).toBe(true);
  });

  it("defines download entitlements", () => {
    expect(getDailyDownloadLimit("FREE")).toBe(1);
    expect(getDailyDownloadLimit("BRONZE")).toBeNull();
    expect(getDailyDownloadLimit("SILVER")).toBeNull();
    expect(getDailyDownloadLimit("GOLD")).toBeNull();
  });

  it("keeps pricing centralized", () => {
    expect(PLAN_CONFIG.BRONZE.priceInPaise).toBe(1000);
    expect(PLAN_CONFIG.SILVER.priceInPaise).toBe(5000);
    expect(PLAN_CONFIG.GOLD.priceInPaise).toBe(10000);
  });
});

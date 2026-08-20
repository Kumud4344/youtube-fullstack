import { describe, expect, it } from "vitest";
import { getThemeForUser } from "@/lib/theme/get-theme-for-user";

describe("getThemeForUser", () => {
  it("uses light theme for South Indian states between 10:00 and 12:00 IST", () => {
    // 2026-08-13 10:30 IST == 05:00 UTC
    const time = new Date("2026-08-13T05:00:00.000Z");
    expect(
      getThemeForUser({
        currentTime: time,
        timezone: "Asia/Kolkata",
        state: "Karnataka",
      }),
    ).toBe("light");
  });

  it("uses dark theme outside the IST window", () => {
    // 2026-08-13 13:00 IST == 07:30 UTC
    const time = new Date("2026-08-13T07:30:00.000Z");
    expect(
      getThemeForUser({
        currentTime: time,
        timezone: "Asia/Kolkata",
        state: "Karnataka",
      }),
    ).toBe("dark");
  });

  it("uses dark theme for non-South-Indian states even in the window", () => {
    const time = new Date("2026-08-13T05:00:00.000Z");
    expect(
      getThemeForUser({
        currentTime: time,
        timezone: "Asia/Kolkata",
        state: "Maharashtra",
      }),
    ).toBe("dark");
  });
});

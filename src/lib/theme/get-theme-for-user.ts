import {
  SOUTH_INDIAN_STATES,
  type SouthIndianState,
} from "@/constants/app";

export type ThemeMode = "light" | "dark";

/**
 * Region + IST time based theme rule.
 * Light theme when IST is 10:00–12:00 and state is South Indian.
 * Uses a trusted currentTime (server/trusted source), not browser clock for business logic.
 */
export function getThemeForUser(params: {
  currentTime: Date;
  timezone?: string;
  state?: string | null;
}): ThemeMode {
  const timezone = params.timezone ?? "Asia/Kolkata";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(params.currentTime);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );
  const minutesOfDay = hour * 60 + minute;
  const inWindow = minutesOfDay >= 10 * 60 && minutesOfDay < 12 * 60;

  const state = params.state?.trim().toLowerCase() ?? "";
  const isSouthIndian = SOUTH_INDIAN_STATES.some(
    (item: SouthIndianState) => item.toLowerCase() === state,
  );

  if (inWindow && isSouthIndian) {
    return "light";
  }

  return "dark";
}

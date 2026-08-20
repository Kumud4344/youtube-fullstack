/**
 * Day bounds in a named IANA timezone (server/trusted clock).
 */
export function getDayRangeForTimezone(
  timeZone: string,
  now = new Date(),
): { start: Date; end: Date; dayKey: string } {
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const start = zonedDateTimeToUtc(dayKey, "00:00:00", timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, dayKey };
}

function zonedDateTimeToUtc(
  ymd: string,
  hms: string,
  timeZone: string,
): Date {
  // Iteratively correct UTC guess so local wall-time in `timeZone` matches.
  let guess = new Date(`${ymd}T${hms}.000Z`);
  for (let i = 0; i < 4; i += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(guess);

    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "00";

    const hour = Number(value("hour") === "24" ? "0" : value("hour"));
    const asUtcMs = Date.UTC(
      Number(value("year")),
      Number(value("month")) - 1,
      Number(value("day")),
      hour,
      Number(value("minute")),
      Number(value("second")),
    );

    const [year, month, day] = ymd.split("-").map(Number);
    const [hh, mm, ss] = hms.split(":").map(Number);
    const desiredMs = Date.UTC(year, month - 1, day, hh, mm, ss);
    guess = new Date(guess.getTime() - (asUtcMs - desiredMs));
  }
  return guess;
}

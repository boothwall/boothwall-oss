const HOUR = 3_600_000;

const stampFormats = new Map<string, Intl.DateTimeFormat>();

/** A fixed, locale-free clock in a zone, used only for maths (never shown). */
function stampFormat(timeZone: string) {
  let format = stampFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    stampFormats.set(timeZone, format);
  }
  return format;
}

/** An IANA zone the runtime knows ("Europe/Zagreb"). Throws nothing. */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 80) return false;
  try {
    stampFormat(value);
    return true;
  } catch {
    return false;
  }
}

/** The wall clock in a zone at an instant: "2026-10-24T23:59:00". */
export function zonedStamp(instant: number, timeZone: string): string {
  const p = Object.fromEntries(
    stampFormat(timeZone)
      .formatToParts(instant)
      .map(({ type, value }) => [type, value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** Today's calendar day in a zone: "2026-10-24". */
export const zonedDay = (timeZone: string, now = Date.now()) =>
  zonedStamp(now, timeZone).slice(0, 10);

/**
 * The instant a wall-clock date and time ("2026-10-25", "02:30") happens in a zone. `null` when
 * the input is malformed, the zone is unknown, or the time is skipped or repeated by a
 * daylight-saving change: we never silently pick one side of a fold.
 */
export function zonedInstant(date: string, time: string, timeZone: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const expected = `${date}T${time}:00`;
  const naive = Date.parse(`${expected}Z`);
  if (!Number.isFinite(naive) || new Date(naive).toISOString().slice(0, 19) !== expected)
    return null;
  if (!isTimeZone(timeZone)) return null;
  const offsets = new Set<number>();
  // Inspect both sides of any offset transition near the date.
  for (let hours = -48; hours <= 48; hours += 12) {
    const at = naive + hours * HOUR;
    offsets.add(Date.parse(`${zonedStamp(at, timeZone)}Z`) - at);
  }
  const matches = [...offsets]
    .map((offset) => naive - offset)
    .filter((instant) => zonedStamp(instant, timeZone) === expected);
  return matches.length === 1 ? matches[0]! : null;
}

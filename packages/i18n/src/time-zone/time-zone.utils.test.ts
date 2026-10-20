import { describe, expect, it } from "vitest";

import { isTimeZone, zonedDay, zonedInstant, zonedStamp } from "./time-zone.utils.ts";

const iso = (instant: number | null) => (instant === null ? null : new Date(instant).toISOString());

describe("time zones", () => {
  it("accepts only zones the runtime knows", () => {
    expect(isTimeZone("Europe/Zagreb")).toBe(true);
    expect(isTimeZone("Mars/Base")).toBe(false);
    expect(isTimeZone("x".repeat(81))).toBe(false);
    expect(isTimeZone(42)).toBe(false);
  });

  it("turns a wall-clock time into its instant and back", () => {
    const start = zonedInstant("2026-10-24", "21:30", "Europe/Zagreb");
    expect(iso(start)).toBe("2026-10-24T19:30:00.000Z");
    expect(zonedStamp(start!, "America/New_York")).toBe("2026-10-24T15:30:00");
    expect(zonedDay("Pacific/Auckland", start!)).toBe("2026-10-25");
  });

  it("rejects times a daylight-saving change skips or repeats, and malformed input", () => {
    expect(zonedInstant("2026-03-29", "02:30", "Europe/Zagreb")).toBeNull();
    expect(zonedInstant("2026-10-25", "02:30", "Europe/Zagreb")).toBeNull();
    expect(iso(zonedInstant("2026-10-25", "03:30", "Europe/Zagreb"))).toBe(
      "2026-10-25T02:30:00.000Z",
    );
    expect(zonedInstant("2026-02-30", "10:00", "UTC")).toBeNull();
    expect(zonedInstant("2026-10-24", "9:00", "UTC")).toBeNull();
    expect(zonedInstant("2026-10-24", "09:00", "Mars/Base")).toBeNull();
  });
});

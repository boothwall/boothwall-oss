import { describe, expect, it } from "vitest";

import { createFormatters } from "./formatters.utils.ts";

const NBSP = " ";
// Runtimes disagree on which narrow space goes before "PM" or around "–"; compare words only.
const plain = (text: string) => text.replace(/\s/g, " ");
const at = Date.parse("2026-10-24T19:30:00Z");

describe("createFormatters", () => {
  it("writes money from minor units with the currency's own decimals", () => {
    const de = createFormatters({ locale: "de", timeZone: "Europe/Berlin" });
    const en = createFormatters({ locale: "en", timeZone: "UTC" });
    expect(de.money(1234, "EUR")).toBe(`12,34${NBSP}€`);
    expect(en.money(500, "USD")).toBe("$5.00");
    expect(en.money(1234, "JPY")).toBe("¥1,234");
  });

  it("shows instants in the given zone, never the runtime's", () => {
    const hr = createFormatters({ locale: "hr", timeZone: "Europe/Zagreb" });
    const ny = createFormatters({ locale: "en", timeZone: "America/New_York" });
    expect(hr.time(at)).toBe("21:30");
    expect(plain(ny.time(at))).toBe("3:30 PM");
    expect(ny.zoneName(at)).toBe("EDT");
  });

  it("keeps calendar days on their day in every zone", () => {
    const far = createFormatters({ locale: "en", timeZone: "Pacific/Kiritimati" });
    expect(far.day("2026-10-24")).toBe("Oct 24, 2026");
    expect(plain(far.dayRange("2026-10-30", "2026-11-02"))).toBe("Oct 30 – Nov 2, 2026");
    expect(far.dayRange("2026-10-24", null)).toBe("Oct 24, 2026");
  });

  it("writes numbers, lists and relative times in the locale", () => {
    const es = createFormatters({ locale: "es", timeZone: "Europe/Madrid" });
    expect(es.number(1234567.891)).toBe("1.234.567,891");
    expect(es.list(["Ana", "Marko", "Iva"])).toBe("Ana, Marko e Iva");
    expect(es.relative(-1, "day")).toBe("ayer");
  });
});

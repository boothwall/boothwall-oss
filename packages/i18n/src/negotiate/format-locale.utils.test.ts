import { describe, expect, it } from "vitest";

import { formatLocale } from "./format-locale.utils.ts";

describe("formatLocale", () => {
  it("keeps the device region when the device speaks the UI language", () => {
    expect(formatLocale("de", ["de-AT", "en"])).toBe("de-AT");
    expect(formatLocale("en", ["en_GB"])).toBe("en-GB");
  });

  it("uses the bare language otherwise, so a region never changes the language", () => {
    expect(formatLocale("hr", ["de-DE", "hr-HR"])).toBe("hr");
    expect(formatLocale("es", [])).toBe("es");
    expect(formatLocale("en", ["en-!!"])).toBe("en");
  });
});

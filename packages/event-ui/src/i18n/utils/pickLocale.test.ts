import { describe, expect, it } from "vitest";

import { pickLocale } from "./pickLocale";

describe("pickLocale", () => {
  it("takes the first language we speak, by language alone, and falls back to English", () => {
    expect(pickLocale(["de-AT", "en-US"])).toBe("de");
    expect(pickLocale(["fr-FR", "DE_ch", "en"])).toBe("de");
    expect(pickLocale(["en-GB", "de"])).toBe("en");
    expect(pickLocale(["fr", "it"])).toBe("en");
    expect(pickLocale([])).toBe("en");
  });
});

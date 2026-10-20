import { describe, expect, it } from "vitest";

import { pickLanguage } from "./pick-language.utils.ts";

describe("pickLanguage", () => {
  it("takes the first candidate it speaks, by language alone", () => {
    expect(pickLanguage(["fr-FR", "de-AT", "en"])).toBe("de");
    expect(pickLanguage([" HR_hr "])).toBe("hr");
  });

  it("skips empty candidates so a missing choice falls through to the next source", () => {
    expect(pickLanguage([null, undefined, "", "es-419"])).toBe("es");
  });

  it("only offers what the surface supports", () => {
    expect(pickLanguage(["hr", "de"], ["en", "de"])).toBe("de");
    expect(pickLanguage(["hr"], ["en", "de"])).toBe("en");
  });

  it("falls back to English, or the surface's first language without it", () => {
    expect(pickLanguage(["fr", "not a tag"])).toBe("en");
    expect(pickLanguage([], ["de", "hr"])).toBe("de");
  });
});

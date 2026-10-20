import { describe, expect, it } from "vitest";

import { LANGUAGES } from "#languages";

import { pluralCategory } from "./plural.utils.ts";

const COUNTS = [0, 1, 2, 3, 5, 11, 12, 21, 22, 25, 101, 111, 1_000_000, 1.5, 0.1, 2.3];

describe("pluralCategory", () => {
  it("uses the runtime's plural rules", () => {
    expect(pluralCategory("hr", 22)).toBe("few");
    expect(pluralCategory("de", 1)).toBe("one");
  });

  it("falls back to tables that agree with the runtime for every launch language", () => {
    for (const language of LANGUAGES)
      for (const n of COUNTS)
        expect([language, n, pluralCategory(language, n, undefined)]).toEqual([
          language,
          n,
          new Intl.PluralRules(language).select(n),
        ]);
  });
});

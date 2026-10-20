import { expect, it } from "vitest";

import { isLanguage, parseLanguage } from "./language.utils.ts";

it("accepts only the supported language codes, exactly", () => {
  expect(isLanguage("hr")).toBe(true);
  for (const bad of ["HR", "hr-HR", "fr", "", null, 7, { toString: () => "en" }])
    expect(parseLanguage(bad)).toBeNull();
});

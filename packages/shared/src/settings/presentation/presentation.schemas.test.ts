import { describe, expect, it } from "vitest";

import { eventPresentationSchema, resolveEventPresentation } from "./presentation.schemas.ts";

describe("event presentation", () => {
  it("accepts old absence, scoped overrides and explicit artwork hiding", () => {
    const defaults = { logoUrl: "/logo.png", sourceLabel: "Source", showSourceOnGuest: true };
    expect(resolveEventPresentation(defaults)).toEqual(defaults);
    expect(resolveEventPresentation(defaults, { logoUrl: null, venue: "Hall A" })).toEqual({
      ...defaults,
      logoUrl: null,
      venue: "Hall A",
    });
    expect(eventPresentationSchema.parse({})).toEqual({});
  });
  it("rejects unsafe URLs, unbounded labels and invalid colours", () => {
    for (const logoUrl of [
      "//evil.test/a",
      "javascript:alert(1)",
      "data:image/svg+xml,test",
      "https://user:pass@example.test/a",
      "/\\evil.test",
      "a.png",
    ]) {
      expect(eventPresentationSchema.safeParse({ logoUrl }).success).toBe(false);
    }
    expect(
      eventPresentationSchema.safeParse({
        theme: { primary: "red", secondary: "#000000", tertiary: "#FFFFFF" },
      }).success,
    ).toBe(false);
    expect(eventPresentationSchema.safeParse({ badge: "x".repeat(33) }).success).toBe(false);
  });
});

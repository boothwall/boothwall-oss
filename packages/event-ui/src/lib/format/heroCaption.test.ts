import { describe, expect, it } from "vitest";

import { frontIndex, heroCaptionScale } from "./heroCaption";

describe("hero captions", () => {
  it("shrinks long captions instead of cutting them, and fronts one that fits", () => {
    expect(heroCaptionScale("Smile!")).toBe(1);
    expect(heroCaptionScale("High five, it shipped")).toBe(0.85);
    expect(heroCaptionScale("x".repeat(60))).toBe(0.7);
    expect(frontIndex(["x".repeat(40), null, "Hi"])).toBe(1);
    expect(frontIndex(["x".repeat(40)])).toBe(0);
  });
});

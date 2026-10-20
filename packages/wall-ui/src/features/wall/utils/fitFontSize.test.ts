import { fitFontSize } from "./fitFontSize";

const opts = { max: 20, min: 10, charWidth: 0.5 };

describe("fitFontSize", () => {
  it("uses the largest size for short text", () => {
    expect(fitFontSize("Hi", 200, opts)).toBe(20);
  });
  it("shrinks longer text to fit the width", () => {
    expect(fitFontSize("x".repeat(30), 200, opts)).toBeCloseTo(13.33, 1);
  });
  it("never goes below the minimum", () => {
    expect(fitFontSize("x".repeat(200), 200, opts)).toBe(10);
  });
});

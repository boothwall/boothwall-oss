import { fitTitleSize } from "./fitTitle";

const sizes = { max: 28, min: 20, badgeGapEm: 0.15 };

describe("fitTitleSize", () => {
  it("keeps the full size while the title fits", () => {
    expect(fitTitleSize(612, { scalable: 230, badge: 0 }, sizes)).toBe(28);
    expect(fitTitleSize(280, { scalable: 280, badge: 0 }, sizes)).toBe(28);
  });

  it("steps down whole dp until the title fits", () => {
    // 506 dp at 28 into 458: 25 dp is 451.8 wide, 26 would be 469.9.
    expect(fitTitleSize(458, { scalable: 506, badge: 0 }, sizes)).toBe(25);
  });

  it("counts the badge at its own size and its gap at the title's", () => {
    // 28 dp: 280 + 4.2 + 60 = 344.2; 27 dp: 270 + 4.05 + 60 = 334.05.
    expect(fitTitleSize(344, { scalable: 280, badge: 60 }, sizes)).toBe(27);
    expect(fitTitleSize(344.2, { scalable: 280, badge: 60 }, sizes)).toBe(28);
  });

  it("stops at the floor, where the name truncates", () => {
    expect(fitTitleSize(200, { scalable: 900, badge: 0 }, sizes)).toBe(20);
  });

  it("keeps the full size until it is measured", () => {
    expect(fitTitleSize(0, { scalable: 900, badge: 0 }, sizes)).toBe(28);
    expect(fitTitleSize(400, { scalable: 0, badge: 0 }, sizes)).toBe(28);
  });
});

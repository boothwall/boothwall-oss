import { CAPTION_LOOKS } from "../constants/captionStyles";
import { POLAROID_TYPE } from "../constants/layout";
import { fitCaption } from "./fitCaption";

const options = { max: 13, smallest: 8, twoLineMax: 11, charWidth: 0.56 };
const fitsLine = (line: string, size: number, width: number) =>
  line.length * options.charWidth * size <= width + 1e-9;

describe("fitCaption", () => {
  it("keeps a short caption on one line at the largest size", () => {
    expect(fitCaption("Team photo!", 100, options)).toEqual({
      text: "Team photo!",
      lines: 1,
      size: 13,
    });
  });

  it("shrinks a longer caption on one line before it takes two", () => {
    const fit = fitCaption("Couch-testing the remote", 120, options);
    expect(fit.lines).toBe(1);
    expect(fit.size).toBeLessThan(options.max);
    expect(fit.size).toBeGreaterThanOrEqual(options.smallest);
  });

  it("sets a caption too long for one line on two, sized so every line fits whole", () => {
    const fit = fitCaption("Thumbs up for D-pad focus at the booth", 100, options);
    expect(fit.lines).toBe(2);
    expect(fit.size).toBeGreaterThanOrEqual(options.smallest);
    for (const line of fit.text.split("\n")) expect(fitsLine(line, fit.size, 100)).toBe(true);
  });

  it("keeps each of two lines at or under the two-line size, in every caption look", () => {
    for (const look of Object.values(CAPTION_LOOKS)) {
      const twoLineMax = POLAROID_TYPE.caption.twoLineMax * look.scale;
      const fit = fitCaption("Thumbs up for D-pad focus at the booth", 60, {
        max: POLAROID_TYPE.caption.max * look.scale,
        smallest: POLAROID_TYPE.caption.min * look.scale,
        twoLineMax,
        charWidth: look.charWidth / look.scale,
      });
      expect(fit.lines).toBe(2);
      expect(fit.size).toBeLessThanOrEqual(twoLineMax);
    }
  });
});

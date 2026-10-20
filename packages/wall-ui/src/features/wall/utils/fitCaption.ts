import { twoLineCaption } from "./captionText";

export type CaptionFit = { text: string; lines: 1 | 2; size: number };

export type CaptionFitOptions = {
  /** The largest size a caption sets at. */
  max: number;
  /** The smallest: one line shrinks to it before a caption takes two. */
  smallest: number;
  /** The largest size of each of two lines. */
  twoLineMax: number;
  /** The font's average glyph width per unit of size (an estimate: Vega can't measure text). */
  charWidth: number;
};

/**
 * How a caption sets in a box `width` wide (sizes in the box's units): one line at the largest
 * size that fits, down to `smallest`, like a hand-written polaroid; a caption too long for that
 * takes two balanced lines, sized for the longer of them, rather than being cut.
 */
export function fitCaption(
  caption: string,
  width: number,
  { max, smallest, twoLineMax, charWidth }: CaptionFitOptions,
): CaptionFit {
  const sizeFor = (length: number, low: number) =>
    Math.min(max, Math.max(low, width / (Math.max(length, 1) * charWidth)));
  const oneLine = sizeFor(caption.length, smallest);
  if (caption.length * charWidth * oneLine <= width) {
    return { text: caption, lines: 1, size: oneLine };
  }
  const text = twoLineCaption(caption);
  const longest = Math.max(...text.split("\n").map((line) => line.length));
  return {
    text,
    lines: text.includes("\n") ? 2 : 1,
    size: Math.min(sizeFor(longest, smallest), twoLineMax),
  };
}

/**
 * The largest font size, between `min` and `max`, at which `text` should fit on one line of
 * `width`. `charWidth` is the font's average glyph width as a fraction of its size. It's an
 * estimate (Vega has no text measuring), so callers still truncate as a last resort.
 */
export function fitFontSize(
  text: string,
  width: number,
  { max, min, charWidth }: { max: number; min: number; charWidth: number },
): number {
  const fits = width / (Math.max(text.length, 1) * charWidth);
  return Math.min(max, Math.max(min, fits));
}

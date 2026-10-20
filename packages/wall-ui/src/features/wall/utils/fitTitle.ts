export type TitleWidths = {
  /** The name (or wordmark), the gap and the year, measured at the full size. */
  scalable: number;
  /** The badge after the year, 0 without one; it keeps its own size. */
  badge: number;
};

export type TitleSizes = {
  max: number;
  min: number;
  /** The badge's gap after the year, as a share of the title's size. */
  badgeGapEm: number;
};

/**
 * The event title's size: the largest whole dp from `max` down to `min` at which it fits `room`.
 * Its text and wordmark grow with the size, so the width measured at `max` is scaled; below
 * `min` the name truncates. Unmeasured (0) widths keep the full size.
 */
export function fitTitleSize(
  room: number,
  { scalable, badge }: TitleWidths,
  { max, min, badgeGapEm }: TitleSizes,
): number {
  if (room <= 0 || scalable <= 0) return max;
  const perDp = scalable / max + (badge > 0 ? badgeGapEm : 0);
  // A hair of slack so an exact fit isn't lost to float rounding.
  const fits = Math.floor((room - badge) / perDp + 1e-9);
  return Math.min(max, Math.max(min, fits));
}

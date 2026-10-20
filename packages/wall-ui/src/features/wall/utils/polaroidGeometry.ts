import { POLAROID, POLAROID_TYPE } from "../constants/layout";

/** Paper around the photo, as shares of the card width: sides and top, above the caption, the foot. */
export const POLAROID_PAPER = { edge: 0.06, captionGap: 0.033, foot: 0.066 } as const;

/**
 * The height the layout plans for a card this wide: the square photo, its paper and a caption
 * line (a lifted card's category line included).
 */
export function polaroidHeight(width: number): number {
  return width * POLAROID.aspect;
}

/**
 * How much taller the category and hashtag line makes a lifted card this wide: it sits under
 * the caption, so the paper grows by its gap and its line.
 */
export function metaLineExtent(width: number): number {
  return ((POLAROID_TYPE.metaGap + POLAROID_TYPE.metaLine) * width) / POLAROID_TYPE.baseWidth;
}

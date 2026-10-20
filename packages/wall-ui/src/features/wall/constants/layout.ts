import type { PhotoDTO } from "@boothwall/shared";
import type { Animated } from "react-native";

import { CANVAS_HEIGHT, CANVAS_WIDTH, layout, size } from "#theme/tokens";

// Wall geometry on the 960x540 dp canvas.

/** Where a card sits: its top-left corner, tilt and width (cards grow when the wall is sparse). */
export type SlotPosition = {
  x: number;
  y: number;
  rotate: number;
  width: number;
  /** Draw order: higher draws above (upper rows above lower, so captions show). */
  layer?: number;
};
/** A slot's slow float, in dp: added to the translateY of every copy of that slot's photo. */
export type SlotDrift = Animated.AnimatedInterpolation<number>;
/** A photo and where it sits; `drift` is its slot's float (none when it opens off the wall). */
export type PlacedPhoto = { photo: PhotoDTO; slot: SlotPosition; drift?: SlotDrift };

/**
 * A wall card: 122 dp wide, and about this tall per unit of width with its caption (the lifted
 * card's category line included).
 */
export const POLAROID = { width: 122, aspect: 1.27 } as const;

/** Polaroid type, in dp for a 118 dp wide card; it scales with the card. */
export const POLAROID_TYPE = {
  baseWidth: 118,
  /**
   * Captions shrink from `max` towards `min` to stay on one line; past that they take two lines,
   * each up to `twoLineMax`.
   */
  caption: { max: 12, min: 8, twoLineMax: 11 },
  /** The step of a one-line caption; a two-line caption steps by its look's leading. */
  captionLine: 15,
  meta: 6.5,
  metaTracking: 0.1,
  metaGap: 1,
  /** The step of the category and hashtag line. */
  metaLine: 9,
} as const;

export type StageBox = { left: number; top: number; right: number; bottom: number };

/** Everything readable stays inside this: 5% in from each edge, clear of TV overscan. */
export const SAFE_AREA: StageBox = {
  left: layout.safeX,
  top: layout.safeY,
  right: CANVAS_WIDTH - layout.safeX,
  bottom: CANVAS_HEIGHT - layout.safeY,
};

/** The header zone across the top of the safe area: logo and year left, event meta right. */
export const HEADER = {
  left: SAFE_AREA.left,
  top: SAFE_AREA.top,
  width: SAFE_AREA.right - SAFE_AREA.left,
  height: layout.headerHeight,
} as const;

/** The split header's band, centred in the header zone: the lockup's mark and the event's rows. */
export const HEADER_BAND = {
  top: HEADER.top + (HEADER.height - size.headerBand) / 2,
  bottom: HEADER.top + (HEADER.height + size.headerBand) / 2,
} as const;

/** Below the header and its gap, down to the safe area's foot: the photos, the panel, the footer. */
export const CONTENT: StageBox = {
  left: SAFE_AREA.left,
  top: HEADER.top + HEADER.height + layout.headerGap,
  right: SAFE_AREA.right,
  bottom: SAFE_AREA.bottom,
};

/** The join panel: a column on the content's right edge, its top on the content's top. */
export const PANEL = {
  left: CONTENT.right - layout.panelWidth,
  top: CONTENT.top,
  width: layout.panelWidth,
  bottom: CONTENT.bottom,
} as const;

/**
 * The "now showing" bar under the photos, its bottom on the safe line: the photo on now, the
 * progress to the next one, and the hosts' announcement in the caption's place while one is up.
 */
export const FOOTER = {
  left: CONTENT.left,
  top: CONTENT.bottom - layout.footerHeight,
  width: PANEL.left - layout.columnGap - CONTENT.left,
  height: layout.footerHeight,
} as const;

/**
 * The area the cards share, envelopes included (tilt, ring, drift; see cardEnvelope): from the
 * content's top and the safe line to one gap before the panel and the footer.
 */
export const STAGE: StageBox = {
  left: CONTENT.left,
  top: CONTENT.top,
  right: FOOTER.left + FOOTER.width,
  bottom: FOOTER.top - layout.footerGap,
};

/** What a card can add around itself on the wall, in dp: the layout keeps all of it on stage. */
export const CARD_REACH = {
  /** The accent ring of the selected card (SelectedPhoto). */
  ringOutset: 5,
  /** The soft shadow plates under a resting card (PolaroidCard). */
  plateOutset: 3,
  /** The slow up-and-down float of a resting card. */
  driftY: 4,
  /** The selected card straightens and grows while it is lifted. */
  liftScale: 1.2,
} as const;

/** The "Page 2 of 3" label on a page turn: centred across the stage, mid-height. */
export const PAGE_BANNER = {
  top: (STAGE.top + STAGE.bottom) / 2 - 16,
  left: STAGE.left,
  width: STAGE.right - STAGE.left,
} as const;

/** The empty wall: three blank cards fanned near the top of the stage, one line under them. */
const GHOST_WIDTH = 150;
const STAGE_CENTRE = (STAGE.left + STAGE.right) / 2;
export const EMPTY_WALL = {
  ghosts: [
    { x: STAGE_CENTRE - GHOST_WIDTH * 1.55, y: STAGE.top + 34, rotate: -6, width: GHOST_WIDTH },
    { x: STAGE_CENTRE - GHOST_WIDTH / 2, y: STAGE.top + 12, rotate: 2, width: GHOST_WIDTH },
    { x: STAGE_CENTRE + GHOST_WIDTH * 0.55, y: STAGE.top + 36, rotate: 5, width: GHOST_WIDTH },
  ] as SlotPosition[],
  headline: { left: STAGE.left, top: STAGE.top + 268, width: STAGE.right - STAGE.left },
} as const;

/** Who's here in the panel: rows it has room for, real photos per stack, and their tilts. */
export const WHO_IS_HERE = { maxRows: 3, thumbs: 3, tilts: ["-6deg", "4deg", "-2deg"] } as const;

/**
 * The wall as it was hand-placed, in dp on the canvas for a POLAROID.width card: three rows of
 * four in reading order, each card at its own height and gentle tilt. Rows overlap only by
 * a card's top edge and upper rows draw above lower ones (`layer`), so every caption stays in
 * view. collageLayout fits the whole composition onto the stage, clear of the panel and footer.
 */
export const SLOTS: readonly SlotPosition[] = [
  { x: 52, y: 78, rotate: -5, layer: 2 },
  { x: 208, y: 72, rotate: 3, layer: 2 },
  { x: 366, y: 80, rotate: -2, layer: 2 },
  { x: 528, y: 74, rotate: 4, layer: 2 },
  { x: 120, y: 206, rotate: 4, layer: 1 },
  { x: 282, y: 200, rotate: -3, layer: 1 },
  { x: 446, y: 210, rotate: 2, layer: 1 },
  { x: 582, y: 216, rotate: -5, layer: 1 },
  { x: 40, y: 330, rotate: -2, layer: 0 },
  { x: 204, y: 336, rotate: 5, layer: 0 },
  { x: 368, y: 328, rotate: -4, layer: 0 },
  { x: 530, y: 334, rotate: 3, layer: 0 },
].map((place) => ({ ...place, width: POLAROID.width }));

/** How many polaroids a page shows; the wall pages through the rest. */
export const SLOT_COUNT = SLOTS.length;

const SPOTLIGHT_CARD_WIDTH = 320;
const SPOTLIGHT_DETAILS_WIDTH = 340;
const SPOTLIGHT_GAP = 48;
const SPOTLIGHT_CARD_LEFT =
  (CANVAS_WIDTH - SPOTLIGHT_CARD_WIDTH - SPOTLIGHT_GAP - SPOTLIGHT_DETAILS_WIDTH) / 2;
export const SPOTLIGHT = {
  cardWidth: SPOTLIGHT_CARD_WIDTH,
  cardLeft: SPOTLIGHT_CARD_LEFT,
  /** The details column's left edge, beside the card. */
  detailsLeft: SPOTLIGHT_CARD_LEFT + SPOTLIGHT_CARD_WIDTH + SPOTLIGHT_GAP,
  cardRotate: -2,
  detailsWidth: SPOTLIGHT_DETAILS_WIDTH,
  gap: SPOTLIGHT_GAP,
} as const;

/** Where a photo that isn't on the current page opens from: the middle of the stage. */
export const CENTRE_SLOT: SlotPosition = {
  x: (STAGE.left + STAGE.right - POLAROID.width) / 2,
  y: (STAGE.top + STAGE.bottom - POLAROID.width * POLAROID.aspect) / 2,
  rotate: 0,
  width: POLAROID.width,
};

/** Start-up overlay card: wide enough for the error copy on two lines. */
export const CONNECTING_CARD_WIDTH = 420;

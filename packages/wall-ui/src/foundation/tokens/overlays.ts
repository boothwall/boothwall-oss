import { CANVAS_HEIGHT, CANVAS_WIDTH, layout, size } from "./layout";

// The photo call and the remote help, in dp on the 960x540 canvas. A host draws them over the
// wall: the TV app over its WallScreen, the browser wall inside it.

/** The photo stage left of the join panel, laid out as the wall lays it out. */
export const overlayStage = {
  left: layout.safeX,
  top: layout.safeY + layout.headerHeight + layout.headerGap,
  width: CANVAS_WIDTH - 2 * layout.safeX - layout.panelWidth - layout.columnGap,
  height:
    CANVAS_HEIGHT -
    2 * layout.safeY -
    layout.headerHeight -
    layout.headerGap -
    layout.footerHeight -
    layout.footerGap,
} as const;

/** The photo call overlay. */
export const photoCall = {
  copyTop: 96,
  copyWidth: 470,
  timerTop: 352,
  ring: 96,
  ringDot: 5,
  ringDots: 60,
  qrTop: 78,
  qrCardWidth: 296,
  qrCardPadding: 20,
  qr: size.recapQr,
  scrimOpacity: 0.96,
  haloOpacity: 0.16,
} as const;

/** The photo call's closing card, over the whole screen: arrivals during a call open full screen behind it. */
export const photoCallFinale = {
  count: 88,
  thumb: 64,
  thumbRadius: 4,
  scrimOpacity: 0.96,
} as const;

/** The remote help card (r14 H1): one row per remote button, over the dimmed wall. */
const HINT_CARD_WIDTH = 528;
const HINT_CARD_PAD_X = 32;

export const remoteHint = {
  cardWidth: HINT_CARD_WIDTH,
  padTop: 26,
  padX: HINT_CARD_PAD_X,
  padBottom: 22,
  /** The countdown line spans the card inside its padding and edge. */
  contentWidth: HINT_CARD_WIDTH - 2 * HINT_CARD_PAD_X - 2 * size.joinGlowStroke,
  titleLine: 30,
  titleGap: 10,
  row: 46,
  rowPadY: 4,
  rowGap: 20,
  keyColumn: 112,
  /** The TV floor for text read from across the room; wall-ui's sizes stop at 18 and 24. */
  label: 20,
  footPadTop: 14,
  footGap: 8,
  timerGap: 14,
  timerRadius: 2,
  keysGap: 6,
  holdGap: 8,
  keyFillOpacity: 0.08,
  key: { height: 36, minWidth: 44, padX: 10 },
  miniKey: { height: 28, minWidth: 32, padX: 7 },
  /** The invisible view that holds the TV focus while the card is open. */
  focusCatcher: 1,
} as const;

/** The glyphs drawn inside key caps, so no system font has to carry them. */
export const keyGlyph = {
  playPause: { height: 14, play: 11, bar: 3, gap: 2.5, playGap: 1 },
  arrow: { height: 16, width: 12 },
  menu: { width: 17, line: 2.5, gap: 3.5, radius: 1 },
  menuMini: { width: 14, line: 2, gap: 3, radius: 1 },
  /** Back, as on the Fire TV remote: drawn on a 24-unit grid, then scaled to the cap. */
  back: {
    box: 22,
    miniBox: 18,
    grid: 24,
    stroke: 2.6,
    tipX: 4,
    lineY: 9.5,
    head: 4.5,
    turnX: 14,
    radius: 5.5,
    endX: 10,
  },
} as const;

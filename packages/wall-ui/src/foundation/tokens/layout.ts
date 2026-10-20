// Sizes are dp on Vega's 960x540 canvas (1080p at 2x).

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 } as const;

/**
 * The wall's layout grid, in dp on the 960x540 canvas (double for 1080p px). Every screen lines
 * up on it: nothing readable leaves the safe area (5% of each edge, clear of TV overscan), the
 * header has a zone of its own, and the content (photos, join panel, footer) starts one gap
 * below it. Layout boxes are derived from these in features/wall/constants/layout.ts.
 */
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const layout = {
  /** 5% of the width: 96 px at 1080p. */
  safeX: 48,
  /** About 5% of the height: 56 px at 1080p. */
  safeY: 28,
  /** The header zone: the logo lockup, year, hashtag, count and Live sit centred in it. */
  headerHeight: 40,
  /** Between the header zone and the content below it. */
  headerGap: 14,
  /** Between the photo stage and the join panel. */
  columnGap: 24,
  /** The "now showing" bar under the photos: caption, category, "n / N" and the progress line. */
  footerHeight: 32,
  /** Between the photos and that bar. */
  footerGap: 8,
  /** Between the cards in the panel column (join, Who's here). */
  panelGap: 12,
  /** The join panel's width. */
  panelWidth: 216,
} as const;

export const radius = { control: 8, card: 16, pill: 999 } as const;

/** Fixed element sizes in dp. */
export const size = {
  /** The wall header lockup: about 377 px wide at 1080p, slim so the photos get the room. */
  logoHeight: 40,
  /**
   * The split header: the BoothWall lockup, a divider, then the event on two rows that span the
   * lockup's mark (32 dp): the title's caps start at the mark's top, the second row's baseline
   * sits on its bottom.
   */
  lockupHeight: 36,
  headerBand: 32,
  eventTitleLine: 26,
  eventLine: 18,
  /**
   * Where Vega sets text in those line boxes, measured: the lifts that put the title's caps a
   * little above the band's top and the second row's baseline a little below its bottom, so the
   * title's descenders clear the second row.
   */
  eventTitleLift: 3.5,
  eventLineLift: 2.75,
  /** Shares of the title's size: its caps (the badge's height), the wordmark's height (its ink */
  eventCapEm: 0.72,
  /** then matches the caps), the gap before the year and the badge's extra gap after it. */
  eventLogoEm: 1.05,
  eventYearGapEm: 0.3,
  eventBadgeGapEm: 0.15,
  /** The join QR (256 px at 1080p): leaves the panel room for Who's here under it. */
  joinQr: 128,
  /** The source card's QR and GitHub mark, when it takes Who's here's turn. */
  sourceQr: 46,
  /** The announcement bar's vertical padding and its accent edge. */
  announcementPadY: 4,
  announcementAccent: 4,
  /** The filled announcement: its bar, the megaphone's disc and glyph, the cue's sheen and lift. */
  announcementBar: 34,
  announcementDisc: 26,
  announcementGlyph: 17,
  /** The sheen image: a 120 dp band slanted across the bar, reaching 10 dp past it each way. */
  announcementSheenWidth: 140,
  announcementSheenHeight: 54,
  announcementLift: 3,
  /** The repo source card's QR (72 dp of code in an 80 dp paper frame), GitHub mark and the */
  /** width its hero name fits into (the panel less the card's padding and the mark's gap). */
  repoQr: 72,
  repoQrPad: 4,
  repoQrRadius: 6,
  repoMark: 15,
  repoHeroWidth: 190,
  /** The GitHub mark on the source card, beside the author's handle. */
  sourceMark: 15,
  /** On an empty wall the QR is the whole point, and Who's here has nothing to say yet. */
  joinQrEmpty: 184,
  /** The join card's glow: the ring's stroke and how far its halo reaches past the card. */
  joinGlowStroke: 2,
  joinHaloReach: 6,
  /** The recap QR once the event is over: the whole point of the screen, readable from afar. */
  recapQr: 232,
  /** The thank-you text beside it. */
  recapTextWidth: 400,
  barTrack: 3,
  shadowSpread: 3,
  tiltInset: 2,
  /** Texture padding for a tilted card's metadata strip, selection ring and shadow. */
  tiltTexturePadding: 48,
  stripLine: 2,
  /** Who's here: each mini polaroid's photo, its paper and the step between stacked ones. */
  thumbPhoto: 16,
  thumbEdge: 2,
  thumbStep: 9,
  /** The arrival spark: its box, the length and thickness of its rays. */
  spark: 28,
  sparkRay: 9,
  sparkStroke: 3,
  focusRing: 3,
  focusHalo: 4,
  /** Box around a reaction emoji, roomier than its glyph so tall emoji aren't clipped. */
  reactionBox: 34,
  /** The wall code screen's on-screen keyboard and code boxes. */
  keyCap: 38,
  keyGap: 6,
  codeSlotWidth: 44,
  codeSlotHeight: 56,
} as const;

/** Scale factors: a focused control grows a little; pop-ins start small and overshoot. */
export const scale = { focus: 1.08, popStart: 0.6, popPeak: 1.15 } as const;

/** Stacking order of everything layered over the collage, bottom to top. */
export const layer = {
  selectedCard: 40,
  /** The signal look's one-off lights: over the cards, under the footer and the chrome. */
  motion: 42,
  footer: 45,
  chrome: 50,
  spotlight: 60,
  /** Above the spotlight, so the open photo gets its reactions too. */
  reactions: 65,
  toast: 70,
  /** The end of the event covers the whole wall; only start-up and exit notices go above. */
  eventOver: 90,
  connecting: 100,
  exitHint: 110,
  /** A host's own layer (WallScreen's `overlay`, e.g. a photo call) covers all of the wall. */
  host: 120,
} as const;

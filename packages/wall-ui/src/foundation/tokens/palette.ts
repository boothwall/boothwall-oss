import {
  boothwallConfig,
  type BrandPalette,
  INK,
  mix,
  readableOn,
  STATUS,
  SURFACE_THEMES,
  SURFACES,
  TEXT_CONTRAST,
  textOn,
  WALL_THEMES,
  type WallTheme,
  withAlpha,
} from "@boothwall/shared";

const { canvas: CANVAS, paper: PAPER } = SURFACES;

/** Bound any custom art plus decorative lights below readable chrome. */
export const CUSTOM_BACKDROP_OPACITY = 0.15;

/**
 * A wall theme's own colours: the accent and its partner (glows, the join card, chips), the
 * canvas and the card tone. Its pictures are in theme/themeArt.ts.
 */
type WallPalette = {
  primary: string;
  /** The accent as text on the dark canvas, when the primary is too dark to read there. */
  primaryOnDark?: string;
  secondary: string;
  tertiary?: string;
  canvas: string;
  /** Solid cards over the backdrop (the join card, Who's here, the bars): readable, in tone. */
  card: string;
};

/** The one place with literal colours. "universal" is the brand's own (boothwall.config.ts). */
const WALL_PALETTES: Record<WallTheme, WallPalette> = {
  universal: {
    ...boothwallConfig.theme,
    canvas: CANVAS,
    card: SURFACE_THEMES.public.surfaceSolid,
  },
  /** Weddings: champagne gold and blush on a warm, deep plum. */
  wedding: {
    primary: "#E9C47F",
    secondary: "#F2A7BC",
    canvas: "#1B1218",
    card: "#2B1D27",
  },
  /** Parties: neon magenta and violet on a near-black purple. */
  party: {
    primary: "#FF4FB0",
    secondary: "#8B6CFF",
    canvas: "#120A1F",
    card: "#221838",
  },
  /** Conferences: cool stage light, cyan and periwinkle on deep blue. */
  conference: {
    primary: "#4CC8FF",
    secondary: "#9DB2FF",
    canvas: "#08142A",
    card: "#13223D",
  },
};

/**
 * The colours that never change with the theme: text, paper, status and shadows. Sizes
 * elsewhere in this file are dp on Vega's 960x540 canvas (1080p at 2x).
 */
export const color = {
  transparent: "transparent",
  surfaceFocused: withAlpha(PAPER, 0.18),
  border: withAlpha(PAPER, 0.14),
  textPrimary: INK.onCanvas,
  textSecondary: INK.onCanvasMuted,
  textMuted: INK.onCanvasSubtle,
  /** Approved, live. */
  success: STATUS.success,
  /** In the queue, waiting for a host. */
  waiting: STATUS.waiting,
  warning: STATUS.warning,
  danger: STATUS.danger,
  focusRing: INK.onCanvas,
  paper: PAPER,
  paperInk: INK.onPaper,
  /** Separators and quiet text on the polaroid paper. */
  paperInkMuted: INK.onPaperMuted,
  shadow: INK.shadow,
  /** Flat stand-in for a drop shadow under wall cards. */
  cardShadowOuter: withAlpha(INK.shadow, 0.18),
  cardShadowInner: withAlpha(INK.shadow, 0.28),
} as const;

/**
 * What a theme changes, worked out from its palette. The text variants fall back to black or
 * white when an accent wouldn't be readable. Read them with `useWallTheme()` (theme/wallTheme).
 */
function wallColors({
  primary,
  primaryOnDark = primary,
  secondary,
  tertiary = secondary,
  canvas,
  card,
}: WallPalette) {
  return {
    /** The flat wall tone behind everything. */
    canvas,
    /** For what must stay readable over the backdrop (the join card, the bars, the source card). */
    surfaceSolid: card,
    /** Panels: the canvas lifted towards the paper, so they follow its tone. */
    surface: mix(canvas, PAPER, 0.07),
    /**
     * The side panel's cards over the backdrop photo: a glassy tint of the partner colour, so
     * the sky shows through and the panel belongs to it (the source card stays solid).
     */
    glass: withAlpha(secondary, 0.1),
    /** Accent fills, borders and glows. */
    brandPrimary: primary,
    brandSecondary: secondary,
    brandTertiary: tertiary,
    /** The accent as text on the dark canvas. */
    brandPrimaryText: readableOn(
      primaryOnDark,
      mix(canvas, "#FFFFFF", CUSTOM_BACKDROP_OPACITY),
      TEXT_CONTRAST.body,
    ),
    /** Accents as text on a polaroid card: small text, so the body-text minimum (4.5:1). */
    brandPrimaryOnPaper: readableOn(primary, PAPER, TEXT_CONTRAST.body),
    brandSecondaryOnPaper: readableOn(secondary, PAPER, TEXT_CONTRAST.body),
    /** Text on top of a primary fill (chips, badges). */
    onBrandPrimary: textOn(primary),
    /** Text on top of a secondary fill (the spotlight category chip). */
    onBrandSecondary: textOn(secondary),
    /** The join card's edge: the accent, soft, so the QR guests act on stands out. */
    joinBorder: withAlpha(primary, 0.55),
    /** The join card's breathing glow: a firm ring hugging the card and a fainter halo outside it. */
    joinGlow: withAlpha(primary, 0.9),
    joinHalo: withAlpha(primary, 0.35),
    /** Soft accent halo just outside the focus ring: a flat border, no blurred shadow. */
    focusHalo: withAlpha(primary, 0.4),
    customBackdropScrim: withAlpha(canvas, 1 - CUSTOM_BACKDROP_OPACITY),
    spotlightScrim: withAlpha(canvas, 0.9),
    /** Over the whole wall once the event is over: the photos are only a hint behind it. */
    eventOverScrim: withAlpha(canvas, 0.94),
    /** Behind the spotlight text, so busy cards underneath never compete with it. */
    spotlightPanel: withAlpha(canvas, 0.6),
  };
}

export type WallColors = ReturnType<typeof wallColors>;

/** Every theme's colours, worked out once: switching themes on the TV only swaps objects. */
export const THEME_COLORS = Object.fromEntries(
  WALL_THEMES.map((theme) => [theme, wallColors(WALL_PALETTES[theme])]),
) as Record<WallTheme, WallColors>;

/**
 * Custom accents retain the named theme’s established readable surfaces. The brand's on-dark
 * accent belongs to its own primary, so a custom palette's text follows the custom primary.
 */
export function resolveWallColors(theme: WallTheme, palette?: BrandPalette): WallColors {
  return palette
    ? wallColors({ ...WALL_PALETTES[theme], primaryOnDark: undefined, ...palette })
    : THEME_COLORS[theme];
}

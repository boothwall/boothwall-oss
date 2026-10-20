import { mix } from "../color/color.utils.ts";

const PAPER = "#FFFCF5";

/**
 * The two surface themes, and the one rule for choosing: what guests and the public see
 * (the wall and the upload page) is on navy; the tools a host works in (the Control panel)
 * are on
 * graphite, so the two never get mixed up. Logo, amber, fonts and status colours are shared.
 */
export type SurfaceTheme = "public" | "host";

export type SurfacePalette = {
  /** The page and wall background. */
  canvas: string;
  /** Cards and controls on the canvas (translucent). */
  surface: string;
  surfaceStrong: string;
  /** Menus and sheets that float over content (opaque). */
  surfaceSolid: string;
  /**
   * The soft light at the top of a page: warm on the left, cool on the right. `transparent`
   * turns it off (the host tools stay plain).
   */
  glowWarm: string;
  glowCool: string;
};

const NAVY = "#0B1020";

export const SURFACE_THEMES: Record<SurfaceTheme, SurfacePalette> = {
  public: {
    canvas: NAVY,
    // Tinted with the brand's info blue, so cards read as part of the navy.
    surface: "rgb(143 169 229 / 0.1)",
    surfaceStrong: "rgb(143 169 229 / 0.18)",
    surfaceSolid: "#1B2539",
    // The brand amber (whatever the config makes it) and the logo's photo violet.
    glowWarm: "color-mix(in srgb, var(--u-primary) 16%, transparent)",
    glowCool: "rgb(101 85 232 / 0.2)",
  },
  host: {
    canvas: "#111214",
    surface: "rgb(255 255 255 / 0.05)",
    surfaceStrong: "rgb(255 255 255 / 0.09)",
    surfaceSolid: "#1C1D21",
    // The original Control panel's warm and blue light at the top, a touch softer than a guest page.
    glowWarm: "color-mix(in srgb, var(--u-primary) 18%, transparent)",
    glowCool: "rgb(80 140 230 / 0.2)",
  },
};

/**
 * The fixed surfaces every app draws on: the canvas behind the wall and the guest pages, and
 * the cream polaroid paper. Brand colours are checked for contrast against these. Panels on
 * the wall are derived from the canvas, so retoning it retones them too. The wall is public,
 * so this is the public theme.
 */
export const SURFACES = {
  canvas: SURFACE_THEMES.public.canvas,
  paper: PAPER,
  /** Panels on the canvas: the canvas lifted a little towards the paper. */
  panel: mix(SURFACE_THEMES.public.canvas, PAPER, 0.07),
} as const;

/**
 * Text and status colours on the dark canvas, ink on the paper, and the shadow tone. The wall
 * (wall-ui tokens) reads them from here; web-ui's theme CSS carries the same values.
 */
export const INK = {
  onCanvas: PAPER,
  onCanvasMuted: "#C3CAD9",
  onCanvasSubtle: "#9AA3B8",
  onPaper: "#17243A",
  onPaperMuted: "#5D6779",
  shadow: "#05070F",
} as const;

/** Status on the canvas; always paired with a word or an icon, never colour alone. */
export const STATUS = {
  success: "#70C39B",
  waiting: "#6685C9",
  warning: "#FFC857",
  danger: "#FF7A70",
} as const;

const declarations = (palette: SurfacePalette) =>
  [
    `--u-canvas:${palette.canvas}`,
    `--u-surface:${palette.surface}`,
    `--u-surface-strong:${palette.surfaceStrong}`,
    `--u-surface-solid:${palette.surfaceSolid}`,
    `--u-glow-warm:${palette.glowWarm}`,
    `--u-glow-cool:${palette.glowCool}`,
  ].join(";");

/**
 * The surface variables @boothwall/web-ui reads, as CSS: public on the root (and on any
 * `data-surface="public"` element, e.g. a wall preview inside a host page), host under
 * `data-surface="host"`. The web apps inline it, so the first paint is already right.
 */
export function surfaceThemeCss(): string {
  return (
    `:root,[data-surface="public"]{${declarations(SURFACE_THEMES.public)}}` +
    `[data-surface="host"]{${declarations(SURFACE_THEMES.host)}}`
  );
}

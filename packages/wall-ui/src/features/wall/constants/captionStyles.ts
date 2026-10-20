import type { CaptionStyle } from "@boothwall/shared";
import { Platform } from "react-native";

export type CaptionLook = {
  /** The family name inside the font file (the TV matches on it); none uses the system font. */
  fontFamily?: string;
  fontWeight: "400" | "500" | "700";
  /** Average glyph width per unit of font size, for fitting a caption on one line. */
  charWidth: number;
  /** Some fonts draw small or large for their size; this evens them out. */
  scale: number;
  /**
   * Faux bold, per card unit: a same-colour shadow nudged sideways. Thin handwriting renders
   * lighter on a TV than in a browser. 0 for none.
   */
  thicken: number;
  letterSpacing?: number;
  /**
   * The step between a two-line caption's lines, per unit of its font size. Handwriting draws
   * small for its size, so each font gets the step that reads as one caption, not two.
   */
  leading: number;
};

/** One look per caption style. The fonts ship in apps/tv-vega/assets/fonts and as web packages. */
export const CAPTION_LOOKS: Record<CaptionStyle, CaptionLook> = {
  kalam: {
    // Native apps load a face by its file name (Kalam-Bold.ttf); the web loads the Kalam family.
    fontFamily: Platform.select({ web: "Kalam", default: "Kalam-Bold" }),
    fontWeight: "700",
    charWidth: 0.56,
    scale: 1,
    thicken: 0.35,
    leading: 1.1,
  },
  classic: {
    fontWeight: "500",
    charWidth: 0.52,
    scale: 0.92,
    thicken: 0,
    letterSpacing: -0.1,
    leading: 1.15,
  },
  marker: {
    fontFamily: "Permanent Marker",
    fontWeight: "400",
    charWidth: 0.6,
    scale: 0.92,
    thicken: 0,
    leading: 1.1,
  },
  caveat: {
    fontFamily: "Caveat",
    fontWeight: "400",
    charWidth: 0.42,
    scale: 1.3,
    thicken: 0.4,
    leading: 0.85,
  },
  typewriter: {
    fontFamily: "Special Elite",
    fontWeight: "400",
    charWidth: 0.6,
    scale: 0.9,
    thicken: 0.15,
    leading: 1,
  },
  clean: {
    fontWeight: "700",
    charWidth: 0.55,
    scale: 0.95,
    thicken: 0,
    letterSpacing: -0.2,
    leading: 1.15,
  },
  gochi: {
    fontFamily: "Gochi Hand",
    fontWeight: "400",
    charWidth: 0.48,
    scale: 1.15,
    thicken: 0.2,
    leading: 0.95,
  },
};

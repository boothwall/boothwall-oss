import {
  type BrandPalette,
  mix,
  readableOn,
  SURFACES,
  TEXT_CONTRAST,
  textOn,
  withAlpha,
} from "@boothwall/shared";
import type { CSSProperties } from "react";
export const PRESENTATION_ART_OPACITY = 0.15;
/** Scoped tokens; no document-wide mutation when switching events. */
export function presentationStyle(theme?: BrandPalette): CSSProperties {
  if (!theme) return {};
  const tokens = {
    "--u-primary": theme.primary,
    "--u-secondary": theme.secondary,
    "--u-tertiary": theme.tertiary,
    "--u-primary-text": readableOn(
      theme.primary,
      mix(SURFACES.canvas, "#FFFFFF", PRESENTATION_ART_OPACITY),
      TEXT_CONTRAST.body,
    ),
    "--u-primary-on-paper": readableOn(theme.primary, SURFACES.paper, 4.5),
    "--u-secondary-on-paper": readableOn(theme.secondary, SURFACES.paper, 4.5),
    "--u-on-primary": textOn(theme.primary),
    "--u-primary-glow": withAlpha(theme.primary, 0.3),
  };
  return {
    ...tokens,
    ...Object.fromEntries(
      Object.entries(tokens).map(([key, value]) => [key.replace("--u-", "--color-"), value]),
    ),
  } as CSSProperties;
}

import type { WallTheme } from "@boothwall/shared";

import conferenceBackdrop from "#assets/themes/conference/backdrop.jpg";
import conferenceBeam from "#assets/themes/conference/beam.png";
import partyBackdrop from "#assets/themes/party/backdrop.jpg";
import partyConfetti from "#assets/themes/party/confetti.png";
import weddingBackdrop from "#assets/themes/wedding/backdrop.jpg";
import weddingLights from "#assets/themes/wedding/lights.png";
import weddingPetals from "#assets/themes/wedding/petals.png";
import { type BundledImage, imageSource, imageUri } from "#platform/assets";
import { BACKDROP_IMAGES } from "#platform/display";

/**
 * Each theme's backdrop, with its still ornaments painted in (scripts/themes/render.mjs draws
 * them). The universal theme has none of its own: it keeps the brand's night sky.
 */
const BACKDROPS: Partial<Record<WallTheme, BundledImage>> = {
  wedding: weddingBackdrop,
  party: partyBackdrop,
  conference: conferenceBackdrop,
};

/** The backdrops as image sources, built once: on the web each is a new `{ uri }` object. */
const BACKDROP_SOURCES = Object.fromEntries(
  Object.entries(BACKDROPS).map(([theme, image]) => [theme, imageSource(image)]),
) as Partial<Record<WallTheme, ReturnType<typeof imageSource>>>;

/** The backdrop to draw for a theme, or null for the universal night sky. */
export function themeBackdrop(theme: WallTheme) {
  return BACKDROP_SOURCES[theme] ?? null;
}

/** A theme's backdrop as a URL, for pictures of the wall outside it (Control's theme picker). */
export function themeBackdropUri(theme: WallTheme): string {
  return imageUri(BACKDROPS[theme] ?? BACKDROP_IMAGES.sky);
}

/** The layers a theme moves over its backdrop. */
export const THEME_LAYERS = {
  wedding: { lights: imageSource(weddingLights), petals: imageSource(weddingPetals) },
  party: { confetti: imageSource(partyConfetti) },
  conference: { beam: imageSource(conferenceBeam) },
};

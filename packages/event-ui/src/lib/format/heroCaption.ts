/**
 * How a caption fits the front card of a collage: its own size up to a short line, then smaller
 * and wrapping, so even the longest caption (60 characters) fits the chin whole. Never cut.
 */
export const HERO_CAPTION_STEPS = [
  { maxLength: 16, scale: 1 },
  { maxLength: 32, scale: 0.85 },
  { maxLength: Infinity, scale: 0.7 },
] as const;

/** The hand-font scale for a caption on the hero card. */
export function heroCaptionScale(caption: string | null): number {
  const length = caption?.length ?? 0;
  return HERO_CAPTION_STEPS.find((step) => length <= step.maxLength)?.scale ?? 0.7;
}

/**
 * Which photo goes in front: the first whose caption fits at full or near-full size, so the hero
 * reads cleanly; the first photo if none does. Its index in `captions`.
 */
export function frontIndex(captions: readonly (string | null)[]): number {
  const fits = captions.findIndex((caption) => heroCaptionScale(caption) >= 0.85);
  return fits === -1 ? 0 : fits;
}

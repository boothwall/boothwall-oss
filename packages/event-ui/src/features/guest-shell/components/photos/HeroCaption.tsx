import type { PolaroidCaptionFont } from "@boothwall/web-ui";

import { heroCaptionScale } from "#lib/format";

/**
 * A caption that wraps to a few short lines, centred in the chin. The kit's caption line is a
 * single truncated line; a photo shown on its own reads better whole.
 */
export function HeroCaption({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <span className="block text-center leading-tight whitespace-normal text-balance">{text}</span>
  );
}

/** The caption's look for a photo shown on its own: same face, a step smaller when long. */
export const heroCaptionFont = (
  font: PolaroidCaptionFont | undefined,
  caption: string | null,
): PolaroidCaptionFont => ({ ...font, scale: (font?.scale ?? 1) * heroCaptionScale(caption) });

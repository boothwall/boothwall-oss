import { cn, Polaroid, type PolaroidCaptionFont } from "@boothwall/web-ui";

import { frontIndex } from "#lib/format";

import { HeroCaption, heroCaptionFont } from "./HeroCaption";

export type CollagePhoto = {
  id: string;
  src: string;
  /** A small copy shown blurred while `src` loads. */
  placeholderSrc?: string;
  alt: string;
  caption: string | null;
};

export type PolaroidCollageProps = {
  /** Up to five, most important first: the first one lands in front, in the middle. */
  photos: readonly CollagePhoto[];
  captionFont?: PolaroidCaptionFont;
  className?: string;
};

/**
 * Where each card lies, in the order they're filled: front centre, then the two either side of
 * it, then the two at the back edges. Tilts stay within the brand's ±4°.
 */
const SLOTS = [
  { place: "top-1/8 left-1/2 w-1/2 -translate-x-1/2", tilt: -1.5 },
  { place: "top-0 left-1/12 w-2/5", tilt: -4 },
  { place: "top-1/24 right-1/12 w-2/5", tilt: 3.5 },
  { place: "top-1/4 left-0 w-1/3", tilt: 3 },
  { place: "top-1/5 right-0 w-1/3", tilt: -3 },
] as const;

/** Stagger for the one entrance on the page: the back cards first, the front one last. */
const ENTRANCE_STEP_MS = 90;

/**
 * A handful of real photos fanned out like prints on a table: the picture at the top of a guest
 * page. Only the front card carries its caption, whole: it wraps and, when long, steps down in
 * size (never an ellipsis). The cards behind are too small for one. Renders nothing without photos.
 */
export function PolaroidCollage({ photos, captionFont, className }: PolaroidCollageProps) {
  const shown = photos.slice(0, SLOTS.length);
  if (shown.length === 0) return null;
  // The front card is the first photo whose caption reads cleanly at that size.
  const front = frontIndex(shown.map((photo) => photo.caption));
  const cards = [shown[front]!, ...shown.filter((_, index) => index !== front)];
  // Back to front, so the most important photo is drawn last and sits on top.
  const layered = SLOTS.slice(0, cards.length)
    .map((slot, index) => ({ slot, photo: cards[index]!, front: index === 0 }))
    .reverse();
  return (
    <div className={cn("relative aspect-5/4 w-full", className)}>
      {layered.map(({ photo, slot, front }, order) => (
        <div
          key={photo.id}
          className={cn("absolute motion-safe:animate-rise-in", slot.place)}
          style={{ animationDelay: `${order * ENTRANCE_STEP_MS}ms` }}
        >
          <Polaroid
            src={photo.src}
            placeholderSrc={photo.placeholderSrc}
            alt={photo.alt}
            caption={front && <HeroCaption text={photo.caption} />}
            captionFont={front ? heroCaptionFont(captionFont, photo.caption) : captionFont}
            tilt={slot.tilt}
            size={front ? "md" : "sm"}
          />
        </div>
      ))}
    </div>
  );
}

/** The caption typeface at the step its length calls for. */

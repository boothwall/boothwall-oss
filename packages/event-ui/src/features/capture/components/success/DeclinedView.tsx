import type { CaptionStyle } from "@boothwall/shared";
import { CAPTION_LOOKS } from "@boothwall/wall-ui/tokens";
import { Button, Polaroid } from "@boothwall/web-ui";
import { Camera, Smile } from "lucide-react";

import { useCaptureCopy } from "#features/capture/hooks";
import { HeroCaption, heroCaptionFont } from "#features/guest-shell/components/photos";

export type DeclinedViewProps = {
  previewUrl: string;
  caption: string | null;
  captionStyle: CaptionStyle;
  onAnother: () => void;
};

/**
 * The host kept the photo off the wall: the guest's own polaroid, greyed and tagged, says so
 * kindly, and the one action is sending another.
 */
export function DeclinedView({ previewUrl, caption, captionStyle, onAnother }: DeclinedViewProps) {
  const copy = useCaptureCopy();
  const shownCaption = caption?.trim() || copy.noCaption;
  return (
    <div className="flex flex-1 flex-col gap-8 lg:grid lg:flex-none lg:grid-cols-2 lg:items-center lg:gap-20">
      <div className="relative mx-auto mt-6 w-3/4 animate-land lg:row-span-2 lg:mt-0 lg:w-full lg:max-w-md">
        <Polaroid
          src={previewUrl}
          alt={copy.previewAlt}
          captionFont={heroCaptionFont(CAPTION_LOOKS[captionStyle], shownCaption)}
          caption={<HeroCaption text={shownCaption} />}
          className="[&_img]:opacity-55 [&_img]:brightness-85 [&_img]:grayscale"
        />
        {/* A square as wide as the card has its centre where the photo's centre is. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-square items-center justify-center">
          <span className="-rotate-6 rounded-pill bg-canvas/80 px-4 py-2 text-ui font-semibold whitespace-nowrap text-ink shadow-paper">
            {copy.declinedTag}
          </span>
        </div>
      </div>
      <div role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-center motion-safe:animate-pop-in lg:items-start lg:text-left">
          <Smile aria-hidden className="size-8 text-ink-muted" strokeWidth={1.8} />
          <h2 className="text-display font-bold tracking-tight text-balance">
            {copy.declinedTitle}
          </h2>
          <p className="max-w-xs text-body text-ink-muted lg:max-w-sm">{copy.declinedBody}</p>
          <span className="mt-1 inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1 text-label font-medium text-ink-muted">
            <span aria-hidden className="size-2 rounded-pill bg-ink-subtle" />
            {copy.declinedStatus}
          </span>
        </div>
      </div>
      <div className="mt-auto lg:mt-0">
        <Button variant="primary" size="lg" fullWidth onClick={onAnother}>
          <Camera aria-hidden className="size-5" strokeWidth={1.8} />
          {copy.sendAnother}
        </Button>
      </div>
    </div>
  );
}

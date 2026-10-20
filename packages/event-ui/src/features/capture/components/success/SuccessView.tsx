import type { CaptionStyle } from "@boothwall/shared";
import { CAPTION_LOOKS } from "@boothwall/wall-ui/tokens";
import { Button, cn, Polaroid } from "@boothwall/web-ui";
import { PartyPopper, Plus, Tv } from "lucide-react";

import { useCaptureCopy } from "#features/capture/hooks";
import { HeroCaption, heroCaptionFont } from "#features/guest-shell/components/photos";

import { DeclinedView } from "./DeclinedView";

export type SuccessViewProps = {
  previewUrl: string;
  caption: string | null;
  captionStyle: CaptionStyle;
  hashtag: string;
  /** On the wall: approved at upload, or since (the page flips when it lands). */
  live: boolean;
  /** Still waiting after a while: a person reviews each photo, so the page says so. */
  slow?: boolean;
  /** The host kept it off the wall; the page offers another go instead. */
  declined?: boolean;
  removed: boolean;
  busy: boolean;
  onAnother: () => void;
  onRemove: () => void;
};

export function SuccessView({
  previewUrl,
  caption,
  captionStyle,
  hashtag,
  live,
  slow = false,
  declined = false,
  removed,
  busy,
  onAnother,
  onRemove,
}: SuccessViewProps) {
  const copy = useCaptureCopy();
  const shownCaption = caption?.trim() || copy.noCaption;
  if (removed) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-6 text-center">
        <p className="text-body text-ink-muted">{copy.removed}</p>
        <Button variant="secondary" size="lg" fullWidth onClick={onAnother}>
          <Plus aria-hidden className="size-5" strokeWidth={1.8} />
          {copy.another}
        </Button>
      </div>
    );
  }
  if (declined) {
    return (
      <DeclinedView
        previewUrl={previewUrl}
        caption={caption}
        captionStyle={captionStyle}
        onAnother={onAnother}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 lg:grid lg:flex-none lg:grid-cols-2 lg:items-center lg:gap-20">
      <Polaroid
        src={previewUrl}
        alt={copy.postedAlt}
        captionFont={heroCaptionFont(CAPTION_LOOKS[captionStyle], shownCaption)}
        caption={<HeroCaption text={shownCaption} />}
        className="mx-auto mt-6 w-3/4 animate-land lg:row-span-2 lg:mt-0 lg:w-full lg:max-w-md"
      />
      {/* The live region stays put so the flip is announced; the keyed content pops in anew. */}
      <div role="status" aria-live="polite">
        <div
          key={live ? "live" : "waiting"}
          className="flex flex-col items-center gap-3 text-center motion-safe:animate-pop-in lg:items-start lg:text-left"
        >
          {live ? (
            <Tv aria-hidden className="size-8 text-success" strokeWidth={1.8} />
          ) : (
            <PartyPopper aria-hidden className="size-8 text-primary-text" strokeWidth={1.8} />
          )}
          <h2 className="text-display font-bold tracking-tight text-balance">
            {live ? copy.liveTitle : copy.successTitle}
          </h2>
          <p className="max-w-xs text-body text-ink-muted lg:max-w-sm">
            {live ? copy.liveBody : slow ? copy.slowBody : copy.successBody}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {!live && (
              <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1 text-label font-medium text-ink-muted">
                <span
                  aria-hidden
                  className="size-2 rounded-pill bg-primary motion-safe:animate-pulse"
                />
                {slow ? copy.slowWaiting : copy.waiting}
              </span>
            )}
            <span
              className={cn(
                "rounded-pill border px-3 py-1 text-label font-semibold",
                live
                  ? "border-success/50 bg-success/10 text-ink"
                  : "border-line bg-surface text-primary-text",
              )}
            >
              {hashtag}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 lg:mt-0">
        <Button variant="secondary" size="lg" fullWidth onClick={onAnother}>
          <Plus aria-hidden className="size-5" strokeWidth={1.8} />
          {copy.another}
        </Button>
        {/* A quiet text link: removing is there when needed, without competing with "Add another". */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          loading={busy}
          className="mx-auto hover:bg-transparent hover:text-danger"
        >
          {busy ? copy.removing : copy.remove}
        </Button>
      </div>
    </div>
  );
}

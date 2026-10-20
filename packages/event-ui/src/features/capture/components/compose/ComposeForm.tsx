import { type CaptionStyle, type Category, PHOTO_LIMITS, type Tribe } from "@boothwall/shared";
import { CAPTION_LOOKS } from "@boothwall/wall-ui/tokens";
import { Button, Polaroid, TextField } from "@boothwall/web-ui";
import { RefreshCw } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import { CategoryPicker } from "#features/capture/components/compose";
import { ConsentLine } from "#features/capture/components/compose";
import { SendBar } from "#features/capture/components/compose";
import { COMPOSE_TILT } from "#features/capture/constants";
import type { MissingStep } from "#features/capture/hooks";
import { useCaptureCopy } from "#features/capture/hooks";

export type ComposeFormProps = {
  previewUrl: string;
  caption: string;
  onCaptionChange: (value: string) => void;
  categories: readonly Category[];
  captionStyle: CaptionStyle;
  tribe: Tribe | null;
  onTribeChange: (tribe: Tribe) => void;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  canSubmit: boolean;
  /** What still blocks sending. */
  missing: MissingStep;
  sending: boolean;
  onSubmit: () => void;
  onRetake: () => void;
};

/**
 * The photo as a polaroid that previews the caption as it is typed in its own field, the
 * categories as chips, and the consent box on top of the Send button. One column on a phone; the polaroid on the
 * left and the rest on the right on a wide screen.
 */
export function ComposeForm(props: ComposeFormProps) {
  const copy = useCaptureCopy();
  const consentRef = useRef<HTMLInputElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [nudged, setNudged] = useState(false);

  // A press on Send that isn't ready yet: light up the box (or bring the categories into view).
  const showMissing = () => {
    if (props.missing === "category") {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      categoriesRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
      return;
    }
    setNudged(true);
    consentRef.current?.focus();
  };
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (props.canSubmit) props.onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col lg:mt-12 lg:grid lg:flex-none lg:grid-cols-2 lg:items-center lg:gap-x-20"
    >
      <div className="flex flex-col items-center pt-6 lg:pt-0">
        {/* The caption shows on the paper as it is typed: a live preview of the wall's card. */}
        <Polaroid
          src={props.previewUrl}
          alt={copy.previewAlt}
          captionFont={CAPTION_LOOKS[props.captionStyle]}
          tilt={COMPOSE_TILT}
          caption={
            props.caption.trim() || (
              <span aria-hidden className="opacity-40">
                {copy.captionPlaceholder}
              </span>
            )
          }
          className="w-4/5 lg:w-full lg:max-w-md"
        />
        <Button variant="ghost" size="sm" onClick={props.onRetake} className="mt-4">
          <RefreshCw aria-hidden className="size-4" strokeWidth={1.8} />
          {copy.retake}
        </Button>
      </div>

      {/* On a phone these are the form's own children, so the Send bar can stick to the bottom
          of the whole form; on a wide screen they stack in the right-hand column. */}
      <div className="contents lg:flex lg:flex-col lg:gap-8">
        <TextField
          label={copy.captionLabel}
          value={props.caption}
          onChange={(event) => props.onCaptionChange(event.target.value)}
          placeholder={copy.captionPlaceholder}
          maxLength={PHOTO_LIMITS.captionMaxLength}
          enterKeyHint="done"
          aside={`${props.caption.length}/${PHOTO_LIMITS.captionMaxLength}`}
          className="mt-6 lg:mt-0"
        />
        <div ref={categoriesRef} className="mt-6 mb-8 scroll-mb-48 lg:m-0">
          <CategoryPicker
            categories={props.categories}
            value={props.tribe}
            onChange={props.onTribeChange}
          />
        </div>
        <div className="mb-4 lg:mb-0">
          <ConsentLine
            checked={props.consent}
            onChange={props.onConsentChange}
            nudged={nudged}
            inputRef={consentRef}
          />
        </div>
        <SendBar
          ready={props.canSubmit}
          hint={copy.submitHint[props.missing]}
          sending={props.sending}
          onBlocked={showMissing}
        />
      </div>
    </form>
  );
}

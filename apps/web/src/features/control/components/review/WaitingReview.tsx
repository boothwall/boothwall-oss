import type { PhotoImagePhase } from "@boothwall/web-ui";
import { Button } from "@boothwall/web-ui";
import { Check, X } from "lucide-react";
import { useState } from "react";

import { deskCopy, FOCUS_LIFT, FOCUS_LIFT_PRIMARY } from "@/features/control/constants";
import { photoAge, photoCaption, photoCategory } from "@/features/control/utils";

import { ConfirmRemove } from "./ConfirmRemove";
import { OriginalNote, OriginalPhoto } from "./OriginalPhoto";
import type { PhotoRowProps } from "./photo-review.types";

const copy = deskCopy.review;
const EYEBROW = "text-label font-semibold tracking-eyebrow text-ink-subtle uppercase";

/** The photo being decided on: the whole original, its caption, category and age, and the two buttons. */
export function WaitingReview({
  photo,
  categories,
  photos,
  confirming,
  onConfirmChange,
  position,
  phase,
  onPhaseChange,
}: PhotoRowProps & {
  position: { index: number; total: number };
  phase: PhotoImagePhase | undefined;
  onPhaseChange: (phase: PhotoImagePhase) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const caption = photoCaption(photo);
  const age = photoAge(photo.createdAt);
  const eyebrow = copy.position(position.index, position.total);
  return (
    <article
      aria-label={eyebrow}
      className="flex flex-col gap-3 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-stretch lg:gap-5"
    >
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <span className={EYEBROW}>{eyebrow}</span>
        <span className="text-label text-ink-subtle">{age}</span>
      </div>
      <OriginalPhoto
        src={photo.imageUrl}
        alt={caption}
        attempt={attempt}
        className="aspect-square w-full"
        onPhaseChange={onPhaseChange}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <span className={`${EYEBROW} max-lg:hidden`}>{eyebrow}</span>
        <p className="font-hand text-title font-bold break-words">{caption}</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-7 items-center rounded-pill bg-surface-strong px-3 text-label font-semibold">
            {photoCategory(photo, categories)}
          </span>
          <span className="inline-flex h-7 items-center rounded-pill border border-line bg-surface px-3 text-label text-ink-muted max-lg:hidden">
            {age}
          </span>
        </div>
        <OriginalNote phase={phase} onRetry={() => setAttempt((n) => n + 1)} />
        <div className="mt-auto">
          {confirming ? (
            <ConfirmRemove
              waiting
              busy={photos.busy !== null}
              onConfirm={() =>
                void photos.act(photo, "remove").then((done) => done && onConfirmChange(null))
              }
              onCancel={() => onConfirmChange(null)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                size="lg"
                className={FOCUS_LIFT}
                disabled={photos.busy !== null}
                onClick={() => onConfirmChange(photo.id)}
              >
                <X aria-hidden className="size-5" strokeWidth={2} />
                {copy.reject}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className={FOCUS_LIFT_PRIMARY}
                disabled={photos.busy !== null || phase !== "loaded"}
                aria-busy={photos.busy === photo.id}
                onClick={() => void photos.act(photo, "approve")}
              >
                <Check aria-hidden className="size-5" strokeWidth={2} />
                {copy.approve}
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

import type { PhotoImagePhase } from "@boothwall/web-ui";
import { IconButton } from "@boothwall/web-ui";
import { Check, X } from "lucide-react";

import { deskCopy, FOCUS_LIFT, FOCUS_LIFT_PRIMARY } from "@/features/control/constants";
import { photoAge, photoCaption, photoCategory } from "@/features/control/utils";

import { ConfirmRemove } from "./ConfirmRemove";
import { OriginalPhoto } from "./OriginalPhoto";
import type { PhotoRowProps } from "./photo-review.types";

const copy = deskCopy.review;

/**
 * A photo further down the queue. Its picture is the original too, so its Approve follows the
 * same rule; pressing the picture brings it up as the photo being decided on.
 */
export function WaitingMini({
  photo,
  categories,
  photos,
  confirming,
  onConfirmChange,
  phase,
  onPhaseChange,
  onOpen,
}: PhotoRowProps & {
  phase: PhotoImagePhase | undefined;
  onPhaseChange: (phase: PhotoImagePhase) => void;
  onOpen: () => void;
}) {
  const caption = photoCaption(photo);
  return (
    <li className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-control border border-line bg-surface p-2.5">
      <button
        type="button"
        aria-label={copy.open(caption)}
        onClick={onOpen}
        className="rounded-tile transition hover:brightness-110 focus-visible:scale-102 focus-visible:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-98"
      >
        <OriginalPhoto
          src={photo.imageUrl}
          alt=""
          fit="cover"
          className="size-19 rounded-tile"
          onPhaseChange={onPhaseChange}
        />
      </button>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate font-hand text-body font-bold">{caption}</p>
        <p className="truncate text-label text-ink-subtle">
          {photoCategory(photo, categories)} · {photoAge(photo.createdAt)}
        </p>
        <div className="mt-1.5">
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
            <div className="flex gap-1.5">
              <IconButton
                variant="secondary"
                size="sm"
                className={FOCUS_LIFT}
                label={`${copy.reject}: ${caption}`}
                icon={<X strokeWidth={2} />}
                disabled={photos.busy !== null}
                onClick={() => onConfirmChange(photo.id)}
              />
              <IconButton
                variant="primary"
                size="sm"
                className={FOCUS_LIFT_PRIMARY}
                label={`${copy.approve}: ${caption}`}
                icon={<Check strokeWidth={2} />}
                disabled={photos.busy !== null || phase !== "loaded"}
                aria-busy={photos.busy === photo.id}
                onClick={() => void photos.act(photo, "approve")}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

import { Button } from "@boothwall/web-ui";
import { ArrowRight } from "lucide-react";

import { deskCopy, FOCUS_LIFT } from "@/features/control/constants";
import type { ControlPhotos } from "@/features/control/hooks";

import { DeskCard } from "../primitives";

const copy = deskCopy.review;
const SHOWN = 6;

/** The newest photos on the wall at a glance, with the way into the full list. */
export function OnWallStrip({
  photos,
  onWall,
  onSeeAll,
}: {
  photos: ControlPhotos;
  onWall: number | null;
  onSeeAll: () => void;
}) {
  if (photos.approved.length === 0) return null;
  return (
    <DeskCard
      title={copy.onWall}
      action={
        <Button variant="ghost" size="sm" className={FOCUS_LIFT} onClick={onSeeAll}>
          {copy.seeAll(onWall)}
          <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
        </Button>
      }
    >
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {photos.approved.slice(0, SHOWN).map((photo) => (
          <li key={photo.id}>
            <img
              className="aspect-square w-full rounded-tile bg-canvas object-cover"
              src={photo.thumbUrl}
              alt=""
            />
          </li>
        ))}
      </ul>
    </DeskCard>
  );
}

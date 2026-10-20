import type { Category } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";
import { useState } from "react";

import { deskCopy } from "@/features/control/constants";
import type { ControlPhotos } from "@/features/control/hooks";

import { OnWallList } from "./OnWallList";
import type { PhotoView } from "./photo-review.types";
import { PhotoTabs } from "./PhotoTabs";
import { WaitingQueue } from "./WaitingQueue";

const copy = deskCopy.review;

/** The queue card: Waiting or On the wall, refreshed every 5 s. */
export function PhotoReview({
  photos,
  categories,
  view,
  onViewChange,
  onWall,
}: {
  photos: ControlPhotos;
  categories: readonly Category[];
  view: PhotoView;
  onViewChange: (view: PhotoView) => void;
  onWall: number | null;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const empty = view === "pending" ? photos.pending.length === 0 : photos.approved.length === 0;
  return (
    <section
      id="photo-review"
      aria-label={copy.label}
      className="flex scroll-mt-4 flex-col gap-4 rounded-card border border-line bg-surface p-3.5 lg:p-5"
    >
      {/* A phone opens On the wall from its strip below, so the switch shows once it's open. */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          view === "pending" && "max-lg:hidden",
        )}
      >
        <PhotoTabs
          current={view}
          waiting={photos.pending.length}
          onWall={onWall}
          onChange={(next) => {
            onViewChange(next);
            setConfirm(null);
          }}
        />
        <span className="text-label text-ink-subtle max-lg:hidden">{copy.updates}</span>
      </div>
      <div id="photo-panel" role="tabpanel" aria-labelledby={`photo-tab-${view}`}>
        {!photos.loaded ? (
          <p role="status">{copy.loading}</p>
        ) : empty ? (
          <p className="text-ink-muted">
            {view === "pending" ? copy.noneWaiting : copy.noneOnWall}
          </p>
        ) : view === "pending" ? (
          <WaitingQueue
            photos={photos}
            categories={categories}
            confirm={confirm}
            onConfirmChange={setConfirm}
          />
        ) : (
          <OnWallList photos={photos} confirm={confirm} onConfirmChange={setConfirm} />
        )}
      </div>
    </section>
  );
}

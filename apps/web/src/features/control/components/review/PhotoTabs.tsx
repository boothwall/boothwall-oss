import { cn, segmentGroupVariants, segmentVariants } from "@boothwall/web-ui";
import type { KeyboardEvent } from "react";

import { deskCopy } from "@/features/control/constants";

import { CountBadge } from "../primitives";
import type { PhotoView } from "./photo-review.types";

const copy = deskCopy.review;

/** Waiting and On the wall, as tabs over one panel; arrows, Home and End move between them. */
export function PhotoTabs({
  current,
  waiting,
  onWall,
  onChange,
}: {
  current: PhotoView;
  waiting: number;
  /** The wall's count from the stats, once they've loaded. */
  onWall: number | null;
  onChange: (view: PhotoView) => void;
}) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: PhotoView =
      event.key === "Home"
        ? "pending"
        : event.key === "End"
          ? "approved"
          : current === "pending"
            ? "approved"
            : "pending";
    onChange(next);
    document.getElementById(`photo-tab-${next}`)?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={copy.photos}
      className={cn("grid w-full grid-cols-2 rounded-pill sm:w-90", segmentGroupVariants())}
      onKeyDown={onKeyDown}
    >
      {(["pending", "approved"] as const).map((view) => {
        const selected = current === view;
        return (
          <button
            key={view}
            type="button"
            role="tab"
            id={`photo-tab-${view}`}
            aria-controls="photo-panel"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cn(
              segmentVariants({ selected, size: "md" }),
              "rounded-pill focus-visible:scale-102",
              !selected && "focus-visible:bg-surface-strong",
            )}
            onClick={() => onChange(view)}
          >
            {view === "pending" ? (
              <>
                {copy.waiting} <CountBadge count={waiting} />
              </>
            ) : (
              <>
                {copy.onWall}
                {onWall !== null && <span>{onWall}</span>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

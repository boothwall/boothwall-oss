import type { ReactNode } from "react";

import { cn } from "#foundations";

export type TvFrameProps = {
  /** What the screen shows: an image, a video or a live component. It fills the 16:9 screen. */
  children: ReactNode;
  className?: string;
};

/**
 * A flat-screen TV seen head on: a thin dark bezel around a 16:9 screen, with a faint sheen
 * across the glass. It fills the width of its container; the bezel scales with it.
 */
export function TvFrame({ children, className }: TvFrameProps) {
  return (
    <div className={cn("@container w-full", className)}>
      <div className="rounded-tile bg-ink-inverse p-tv-bezel shadow-paper ring-1 ring-line">
        <div className="relative aspect-video overflow-hidden rounded-photo bg-canvas [&>img]:size-full [&>img]:object-cover">
          {children}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-br from-ink/8 via-transparent to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

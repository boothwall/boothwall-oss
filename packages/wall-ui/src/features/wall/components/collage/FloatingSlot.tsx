import type { PhotoDTO } from "@boothwall/shared";
import React, { memo, useEffect, useState } from "react";

import type { SlotDrift, SlotPosition } from "#features/wall/constants/layout";

import { EXIT_MS, FloatingPhoto } from "./FloatingPhoto";

export type FloatingSlotProps = {
  photo: PhotoDTO | null;
  slot: SlotPosition;
  /** The slot's slow float (see useSlotDrift), shared with any lifted or spotlit copy. */
  drift: SlotDrift | undefined;
  /** Draw order among the cards (see WallCollage: upper rows above, the newest on top). */
  zIndex: number;
  /**
   * Set on a page turn: how long this card waits before swapping, so the turn sweeps across
   * the wall. Null for an ordinary swap.
   */
  swapDelayMs: number | null;
  isFresh: boolean;
  /**
   * This photo is drawn elsewhere right now (lifted by SelectedPhoto, or open in the
   * spotlight): hide this card, so the photo is never on screen twice.
   */
  hidden: boolean;
  onSettled: (photoId: string) => void;
};

export const FloatingSlot = memo(function FloatingSlot({
  photo,
  swapDelayMs,
  ...rest
}: FloatingSlotProps) {
  // Derived during render (not in an effect) so the outgoing card is never
  // unmounted for a frame: it keeps its instance and decoded image while it fades.
  const [shown, setShown] = useState<{
    current: PhotoDTO | null;
    leaving: PhotoDTO | null;
    sweep: boolean;
    delayMs: number;
  }>({ current: photo, leaving: null, sweep: false, delayMs: 0 });
  if (shown.current?.id !== photo?.id) {
    setShown({
      current: photo,
      leaving: shown.current,
      sweep: swapDelayMs !== null,
      delayMs: swapDelayMs ?? 0,
    });
  }

  const leavingId = shown.leaving?.id;
  const { delayMs, sweep } = shown;
  useEffect(() => {
    if (!leavingId) return;
    const timer = setTimeout(
      () => setShown((state) => ({ ...state, leaving: null })),
      EXIT_MS + delayMs,
    );
    return () => clearTimeout(timer);
  }, [delayMs, leavingId]);

  return (
    <>
      {[shown.leaving, shown.current].map(
        (item) =>
          item && (
            <FloatingPhoto
              key={item.id}
              photo={item}
              exiting={item.id === leavingId}
              delayMs={delayMs}
              sweep={sweep}
              {...rest}
            />
          ),
      )}
    </>
  );
});

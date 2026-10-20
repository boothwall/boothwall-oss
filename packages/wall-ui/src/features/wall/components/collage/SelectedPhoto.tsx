import React, { memo, useEffect, useState } from "react";

import { type PlacedPhoto } from "#features/wall/constants/layout";

import { LIFT_MS, LiftedCard } from "./LiftedCard";

export type SelectedPhotoProps = {
  selection: PlacedPhoto | null;
  /**
   * The selection just moved into the spotlight, which flies its own copy out of the slot:
   * this one leaves at once instead of settling back, so the photo is never on screen twice.
   */
  handedOff: boolean;
  /**
   * The copy of this photo is now drawn over its card: only then may the card hide, so the
   * photo never blinks out while the copy waits for its image.
   */
  onLifted: (photoId: string) => void;
};

/**
 * The selected card, lifted in place: a copy in its own layer (reordering native views makes
 * cards blink on Vega) drawn exactly over its slot, while FloatingSlot hides the original. It
 * straightens, grows and gets the accent ring; it never moves off its slot, so no second copy shows.
 */
export const SelectedPhoto = memo(function SelectedPhoto({
  selection,
  handedOff,
  onLifted,
}: SelectedPhotoProps) {
  const [shown, setShown] = useState<{ current: PlacedPhoto | null; leaving: PlacedPhoto | null }>({
    current: selection,
    leaving: null,
  });
  if (shown.current?.photo.id !== selection?.photo.id) {
    setShown({ current: selection, leaving: shown.current });
  }

  const leavingId = shown.leaving?.photo.id;
  useEffect(() => {
    if (!leavingId) return;
    const timer = setTimeout(() => setShown((state) => ({ ...state, leaving: null })), LIFT_MS);
    return () => clearTimeout(timer);
  }, [leavingId]);

  return (
    <>
      {[shown.leaving, shown.current].map(
        (item) =>
          item && (
            <LiftedCard
              key={item.photo.id}
              photo={item.photo}
              slot={item.slot}
              drift={item.drift}
              active={item.photo.id === selection?.photo.id}
              handedOff={handedOff}
              onLifted={onLifted}
            />
          ),
      )}
    </>
  );
});

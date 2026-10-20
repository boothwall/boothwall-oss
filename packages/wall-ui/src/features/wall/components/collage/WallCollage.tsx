import type { PhotoDTO } from "@boothwall/shared";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PlacedPhoto, SlotDrift, SlotPosition } from "#features/wall/constants/layout";
import { PAGE_STAGGER_MS } from "#features/wall/constants/timing";
import type { WallState } from "#features/wall/state/wallState";
import { drawOrder } from "#features/wall/utils/drawOrder";

import { SignalMoments } from "../overlays/SignalMoments";
import { EmptyWall } from "./EmptyWall";
import { FloatingSlot } from "./FloatingSlot";
import { SelectedPhoto } from "./SelectedPhoto";

export type WallCollageProps = {
  wall: WallState;
  /** Where each slot's card sits right now (see placeSlots). */
  positions: readonly SlotPosition[];
  /** Each slot's float (see useSlotDrift), one per position. */
  drifts: readonly SlotDrift[];
  /** The lifted selection, or null while the spotlight is open. */
  selection: PlacedPhoto | null;
  /** The slot whose photo is drawn elsewhere (lifted or in the spotlight), if any. */
  hiddenSlot: number | null;
  /** The spotlight has the selection: the lifted copy leaves at once. */
  spotlightOpen: boolean;
  onSettled: (photoId: string) => void;
};

export const WallCollage = memo(function WallCollage({
  wall,
  positions,
  drifts,
  selection,
  hiddenSlot,
  spotlightOpen,
  onSettled,
}: WallCollageProps) {
  const photos = useMemo(
    () => new Map<string, PhotoDTO>(wall.pool.map((photo) => [photo.id, photo])),
    [wall.pool],
  );
  const isEmpty = wall.slots.every((id) => id === null);
  const zIndexes = useMemo(
    () => drawOrder(wall.slots, positions, photos),
    [photos, positions, wall.slots],
  );
  // The selected card hides only once its lifted copy is drawn over it (see SelectedPhoto).
  const selectedId = selection?.photo.id ?? null;
  const [handoff, setHandoff] = useState({ photoId: selectedId, lifted: false });
  if (handoff.photoId !== selectedId) setHandoff({ photoId: selectedId, lifted: false });
  const handleLifted = useCallback(
    (photoId: string) =>
      setHandoff((state) =>
        state.photoId === photoId && !state.lifted ? { photoId, lifted: true } : state,
      ),
    [],
  );
  const coveredSlot = selection === null || handoff.lifted ? hiddenSlot : null;
  // A page turn swaps every card; a wave in reading order reads better than all at once.
  const lastTurn = useRef(wall.turn);
  const turning = wall.turn !== lastTurn.current;
  useEffect(() => {
    lastTurn.current = wall.turn;
  }, [wall.turn]);

  return (
    <>
      {positions.map((slot, index) => {
        const id = wall.slots[index] ?? null;
        return (
          <FloatingSlot
            key={index}
            photo={id ? (photos.get(id) ?? null) : null}
            slot={slot}
            drift={drifts[index]}
            zIndex={zIndexes[index] ?? 0}
            swapDelayMs={turning ? index * PAGE_STAGGER_MS : null}
            isFresh={id !== null && wall.fresh.includes(id)}
            hidden={index === coveredSlot}
            onSettled={onSettled}
          />
        );
      })}

      <SelectedPhoto selection={selection} handedOff={spotlightOpen} onLifted={handleLifted} />
      <SignalMoments wall={wall} positions={positions} drifts={drifts} />

      {isEmpty && <EmptyWall />}
    </>
  );
});

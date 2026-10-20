import { type SlotPosition, SLOTS, STAGE, type StageBox } from "../constants/layout";
import { cardEnvelope, RESTING_REACH, unionBox } from "./cardEnvelope";

/** Each slot scaled by `scale` about the composition's top-left corner, then moved by (dx, dy). */
function transform(
  slots: readonly SlotPosition[],
  scale: number,
  dx: number,
  dy: number,
): SlotPosition[] {
  return slots.map((slot) => ({
    ...slot,
    x: slot.x * scale + dx,
    y: slot.y * scale + dy,
    width: slot.width * scale,
  }));
}

/** Everything the resting cards cover, tilt, shadow and float included. */
export function drawnBox(slots: readonly SlotPosition[]): StageBox {
  return unionBox(slots.map((slot) => cardEnvelope(slot, RESTING_REACH)))!;
}

/**
 * The hand-placed wall (SLOTS) fitted onto `stage`: scaled as a whole, never up, so the
 * composition keeps its proportions, then centred on the stage.
 */
export function fitSlots(
  slots: readonly SlotPosition[] = SLOTS,
  stage: StageBox = STAGE,
): SlotPosition[] {
  const room = { x: stage.right - stage.left, y: stage.bottom - stage.top };
  const fits = (scale: number) => {
    const box = drawnBox(transform(slots, scale, 0, 0));
    return box.right - box.left <= room.x && box.bottom - box.top <= room.y;
  };
  // The plates and float don't scale with the card, so search for the largest scale that fits.
  let [low, high] = [0, 1];
  if (fits(1)) low = 1;
  else
    for (let step = 0; step < 30; step++) {
      const mid = (low + high) / 2;
      if (fits(mid)) low = mid;
      else high = mid;
    }
  const box = drawnBox(transform(slots, low, 0, 0));
  const dx = stage.left - box.left + (room.x - (box.right - box.left)) / 2;
  const dy = stage.top - box.top + (room.y - (box.bottom - box.top)) / 2;
  return transform(slots, low, dx, dy);
}

/** Where each slot's card sits on the stage. */
export const SLOT_POSITIONS: readonly SlotPosition[] = fitSlots();

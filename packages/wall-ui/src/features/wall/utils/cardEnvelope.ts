import { CARD_REACH, type SlotPosition, type StageBox } from "../constants/layout";
import { polaroidHeight } from "./polaroidGeometry";

export type ReachOptions = {
  /** The card's scale around its centre (a lifted card grows). */
  scale?: number;
  /** Drawn straight rather than at the slot's tilt (the lifted card). */
  upright?: boolean;
  /** Anything drawn around the card, in dp before scaling (the shadow plates, the accent ring). */
  outset?: number;
  /** How far the card drifts up and down from its place. */
  driftY?: number;
};

/** A resting card on the wall: its shadow plates and its float. */
export const RESTING_REACH: ReachOptions = {
  outset: CARD_REACH.plateOutset,
  driftY: CARD_REACH.driftY,
};

/** The selected card, lifted: straightened and grown, with its ring. */
export const LIFTED_REACH: ReachOptions = {
  scale: CARD_REACH.liftScale,
  upright: true,
  outset: CARD_REACH.ringOutset,
};

/**
 * Everything a card covers on screen, rotation included: the axis-aligned box around the tilted
 * card and whatever it draws around itself. Cards rotate and scale around their centre.
 */
export function cardEnvelope(slot: SlotPosition, reach: ReachOptions = {}): StageBox {
  const { scale = 1, upright = false, outset = 0, driftY = 0 } = reach;
  const height = polaroidHeight(slot.width);
  const centreX = slot.x + slot.width / 2;
  const centreY = slot.y + height / 2;
  const tilt = upright ? 0 : Math.abs(slot.rotate);
  const radians = (tilt * Math.PI) / 180;
  const w = (slot.width + outset * 2) * scale;
  const h = (height + outset * 2) * scale;
  const halfX = (w * Math.cos(radians) + h * Math.sin(radians)) / 2;
  const halfY = (w * Math.sin(radians) + h * Math.cos(radians)) / 2;
  return {
    left: centreX - halfX,
    top: centreY - halfY - driftY,
    right: centreX + halfX,
    bottom: centreY + halfY + driftY,
  };
}

/** The box around several boxes. */
export function unionBox(boxes: readonly StageBox[]): StageBox | null {
  if (boxes.length === 0) return null;
  return boxes.reduce((a, b) => ({
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  }));
}

/** How far a box must move to sit inside `bounds` (zero when it already does). */
export function shiftInside(box: StageBox, bounds: StageBox): { x: number; y: number } {
  const along = (start: number, end: number, min: number, max: number) => {
    if (start < min) return min - start;
    if (end > max) return max - end;
    return 0;
  };
  return {
    x: along(box.left, box.right, bounds.left, bounds.right),
    y: along(box.top, box.bottom, bounds.top, bounds.bottom),
  };
}

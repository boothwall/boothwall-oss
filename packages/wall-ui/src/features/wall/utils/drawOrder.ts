import type { PhotoDTO } from "@boothwall/shared";

import type { SlotPosition } from "../constants/layout";

/**
 * Each card's zIndex: upper rows above lower ones (their captions stay in view), and within a
 * row the newest photo on top. The lifted card and the spotlight are layers of their own.
 */
export function drawOrder(
  slots: readonly (string | null)[],
  positions: readonly SlotPosition[],
  photos: ReadonlyMap<string, PhotoDTO>,
): number[] {
  const newestFirst = slots
    .map((id) => (id ? photos.get(id) : undefined))
    .filter((photo): photo is PhotoDTO => photo !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((photo) => photo.id);
  const rankOf = new Map(newestFirst.map((id, i) => [id, slots.length - i]));
  const rank = (id: string | null) => (id ? (rankOf.get(id) ?? slots.length + 1) : 0);
  return slots.map((id, index) => (positions[index]?.layer ?? 0) * (slots.length + 1) + rank(id));
}

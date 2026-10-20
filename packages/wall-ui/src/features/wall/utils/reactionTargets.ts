import type { PhotoDTO } from "@boothwall/shared";

import { FLOAT_RISE_DP, type ReactionTarget } from "#features/reactions";
import { CANVAS_HEIGHT } from "#theme/tokens";

import { POLAROID, type SlotPosition, SPOTLIGHT, STAGE } from "../constants/layout";

/**
 * Where reactions can float: over every card on the wall, or only over the open photo while
 * the spotlight covers the rest. The spotlight card sits centred on the canvas.
 */
export function reactionTargets(
  pool: PhotoDTO[],
  slots: (string | null)[],
  positions: readonly SlotPosition[],
  spotlightPhoto: PhotoDTO | null,
): ReactionTarget[] {
  if (spotlightPhoto) {
    const height = SPOTLIGHT.cardWidth * POLAROID.aspect;
    return [
      {
        photoId: spotlightPhoto.id,
        reactions: spotlightPhoto.reactions,
        x: SPOTLIGHT.cardLeft,
        y: (CANVAS_HEIGHT - height) / 2,
        width: SPOTLIGHT.cardWidth,
      },
    ];
  }
  const byId = new Map(pool.map((photo) => [photo.id, photo]));
  return slots.flatMap((id, index) => {
    const photo = id === null ? undefined : byId.get(id);
    const slot = positions[index];
    if (!photo || !slot) return [];
    return [
      {
        photoId: photo.id,
        reactions: photo.reactions,
        x: slot.x,
        // A float rises from here; from a top-row card it starts lower, so it never reaches the
        // header gap.
        y: Math.max(slot.y, STAGE.top + FLOAT_RISE_DP),
        width: slot.width,
      },
    ];
  });
}

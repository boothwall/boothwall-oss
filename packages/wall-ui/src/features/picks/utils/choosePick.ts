import type { PhotoDTO } from "@boothwall/shared";

import { PICK_RULES } from "../constants/picks";

export type PickKind = "crowd" | "ai";

export type Pick = {
  photo: PhotoDTO;
  kind: PickKind;
  /** All its reactions, for the crowd favourite's badge. */
  reactions: number;
};

const totalReactions = (photo: PhotoDTO) =>
  photo.reactions ? Object.values(photo.reactions).reduce((sum, n) => sum + n, 0) : 0;

const best = <T>(items: T[], score: (item: T) => number): T | undefined =>
  items.reduce<T | undefined>(
    (top, item) => (top === undefined || score(item) > score(top) ? item : top),
    undefined,
  );

/**
 * The photo the wall should show off next: the one with the most reactions (a crowd favourite)
 * or the one the smart check rated best for the big screen (an AI pick). Recently picked photos
 * sit out, and when both kinds qualify the wall takes turns. Null when nothing qualifies.
 */
export function choosePick(
  pool: readonly PhotoDTO[],
  recent: readonly string[],
  lastKind: PickKind | null,
): Pick | null {
  const candidates = pool.filter((photo) => !recent.includes(photo.id));
  const crowd = best(
    candidates.filter((photo) => totalReactions(photo) >= PICK_RULES.minReactions),
    totalReactions,
  );
  const ai = best(
    candidates.filter((photo) => (photo.highlight ?? 0) >= PICK_RULES.minHighlight),
    (photo) => photo.highlight ?? 0,
  );
  const kind: PickKind | null =
    crowd && ai ? (lastKind === "crowd" ? "ai" : "crowd") : crowd ? "crowd" : ai ? "ai" : null;
  const photo = kind === "crowd" ? crowd : kind === "ai" ? ai : undefined;
  return photo && kind ? { photo, kind, reactions: totalReactions(photo) } : null;
}

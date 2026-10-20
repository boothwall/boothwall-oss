import type { WallState } from "./wallState";

/**
 * The wall shows the pool a page at a time: page 1 is the newest photos, one per slot, page 2
 * the next ones, and the last page may be partly empty. Pages always start at a multiple of the
 * slot count, so "Page 2 of 3" means the same photos however the wall got there.
 */

export const pageCount = ({ pool, slots }: WallState): number =>
  Math.max(1, Math.ceil(pool.length / slots.length));

/**
 * The page (0-based) the cards on screen belong to: the one most of them come from. A live
 * arrival in one slot, or the pool shifting by one as it arrives, doesn't change it.
 */
export function pageOf({ pool, slots }: WallState): number {
  const votes = new Map<number, number>();
  for (const id of slots) {
    const index = pool.findIndex((photo) => photo.id === id);
    if (index === -1) continue;
    const page = Math.floor(index / slots.length);
    votes.set(page, (votes.get(page) ?? 0) + 1);
  }
  let best = 0;
  let bestVotes = 0;
  for (const [page, count] of votes) {
    if (count > bestVotes) [best, bestVotes] = [page, count];
  }
  return best;
}

/** The slots for the page after (or before) the one on screen, wrapping round both ends. */
export function nextPage(state: WallState, direction: 1 | -1): (string | null)[] {
  const pages = pageCount(state);
  if (pages === 1) return state.slots;
  const page = (pageOf(state) + direction + pages) % pages;
  const start = page * state.slots.length;
  return state.slots.map((_, k) => state.pool[start + k]?.id ?? null);
}

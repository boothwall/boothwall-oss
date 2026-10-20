import { type ReactionCounts, REACTIONS } from "@boothwall/shared";

/** Per reaction, the larger count. Counts only grow, so the larger one is the newer one. */
const newest = (a: ReactionCounts, b: ReactionCounts): ReactionCounts =>
  Object.fromEntries(
    REACTIONS.map((reaction) => [reaction, Math.max(a[reaction], b[reaction])]),
  ) as ReactionCounts;

/**
 * Coalesces reaction updates so a burst of taps becomes one event per photo. Taps can report
 * their totals out of order (two requests racing to the room), so it keeps the highest count
 * seen per reaction and never sends a total lower than one it already sent.
 */
export class ReactionBatch {
  private readonly latest = new Map<string, ReactionCounts>();
  private readonly dirty = new Set<string>();

  /** Records a photo's totals. True when this starts a new batch, i.e. a flush is due. */
  add(photoId: string, counts: ReactionCounts): boolean {
    const starts = this.dirty.size === 0;
    const known = this.latest.get(photoId);
    this.latest.set(photoId, known ? newest(known, counts) : counts);
    this.dirty.add(photoId);
    return starts;
  }

  /** The photos that changed since the last drain, with their latest totals. */
  drain(): { photoId: string; counts: ReactionCounts }[] {
    const changed = [...this.dirty].flatMap((photoId) => {
      const counts = this.latest.get(photoId);
      return counts ? [{ photoId, counts }] : [];
    });
    this.dirty.clear();
    return changed;
  }
}

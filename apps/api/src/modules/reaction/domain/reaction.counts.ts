import { emptyReactionCounts, type ReactionCounts, REACTIONS } from "@boothwall/shared";

/**
 * The stored JSON as full counts: every reaction present, anything unknown or malformed
 * dropped. A reaction removed from the list later simply stops showing.
 */
export const parseReactionCounts = (stored: string | null | undefined): ReactionCounts => {
  const counts = emptyReactionCounts();
  if (!stored) return counts;
  let saved: unknown;
  try {
    saved = JSON.parse(stored);
  } catch {
    return counts;
  }
  if (typeof saved !== "object" || saved === null) return counts;
  for (const reaction of REACTIONS) {
    const value = (saved as Record<string, unknown>)[reaction];
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      counts[reaction] = value;
    }
  }
  return counts;
};

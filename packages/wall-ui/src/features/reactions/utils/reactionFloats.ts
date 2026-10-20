import { type Reaction, type ReactionCounts, REACTIONS } from "@boothwall/shared";

import { MAX_FLOATS_PER_REACTION } from "../constants/reactions";

export type ReactionFloatSpec = {
  /** Unique for the float's life, for React keys and removal. */
  key: string;
  reaction: Reaction;
  /** Where it starts, in canvas dp: the centre of the card's top edge, plus a sideways offset. */
  x: number;
  y: number;
  /** Position within its burst, for the stagger. */
  order: number;
};

/**
 * New floats for one photo whose totals went from `before` to `after`: one per new tap, at
 * most MAX_FLOATS_PER_REACTION per reaction. Totals that went down (a reset) float nothing.
 */
export function reactionIncreases(
  before: Partial<ReactionCounts> | undefined,
  after: Partial<ReactionCounts>,
): Reaction[] {
  return REACTIONS.flatMap((reaction) => {
    const added = (after[reaction] ?? 0) - (before?.[reaction] ?? 0);
    return Array<Reaction>(Math.max(0, Math.min(added, MAX_FLOATS_PER_REACTION))).fill(reaction);
  });
}

/** `active` plus as many of `incoming` as fit under `max`; the rest are dropped. */
export const admitFloats = <T>(active: T[], incoming: T[], max: number): T[] =>
  active.length >= max ? active : [...active, ...incoming.slice(0, max - active.length)];

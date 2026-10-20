import type { ReactionCounts } from "@boothwall/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { FLOAT_SPREAD } from "../constants/motion";
import { MAX_FLOATS } from "../constants/reactions";
import { admitFloats, type ReactionFloatSpec, reactionIncreases } from "../utils/reactionFloats";

/** A photo card on screen that reactions can float over, in canvas dp. */
export type ReactionTarget = {
  photoId: string;
  reactions?: Partial<ReactionCounts>;
  x: number;
  y: number;
  width: number;
};

/**
 * Turns rising reaction totals on visible photos into floats. A photo's first sighting only
 * records its totals, so cards arriving (or coming back on a page turn) don't burst with taps
 * they collected elsewhere.
 */
export function useReactionFloats(targets: ReactionTarget[]) {
  const [floats, setFloats] = useState<ReactionFloatSpec[]>([]);
  const seen = useRef(new Map<string, Partial<ReactionCounts>>());
  const nextKey = useRef(0);

  useEffect(() => {
    const visible = new Set(targets.map((target) => target.photoId));
    for (const id of [...seen.current.keys()]) if (!visible.has(id)) seen.current.delete(id);

    const incoming = targets.flatMap((target) => {
      const counts = target.reactions ?? {};
      const before = seen.current.get(target.photoId);
      seen.current.set(target.photoId, counts);
      if (!before) return [];
      const added = reactionIncreases(before, counts);
      return added.map((reaction, order) => ({
        key: String(nextKey.current++),
        reaction,
        // Spread a burst across the card's top edge, centred.
        x: target.x + target.width * (0.5 + FLOAT_SPREAD * ((order + 0.5) / added.length - 0.5)),
        y: target.y,
        order,
      }));
    });
    if (incoming.length > 0) setFloats((active) => admitFloats(active, incoming, MAX_FLOATS));
  }, [targets]);

  const finish = useCallback(
    (key: string) => setFloats((active) => active.filter((float) => float.key !== key)),
    [],
  );

  return { floats, finish };
}

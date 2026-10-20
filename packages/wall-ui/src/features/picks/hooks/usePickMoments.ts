import type { PhotoDTO } from "@boothwall/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { PICK_RULES, PICK_TIMING } from "../constants/picks";
import { choosePick, type Pick, type PickKind } from "../utils/choosePick";

export type PickMomentsOptions = {
  pool: readonly PhotoDTO[];
  /** The `showPicks` setting (and off while the event is over). */
  enabled: boolean;
  /**
   * True while a photo is open full screen, an arrival is queued or the wall is paused: the pick
   * waits a little. Asked when a pick is due, so it can read state from after this hook.
   */
  isBusy: () => boolean;
};

/**
 * Every few minutes, the wall's moment for a crowd favourite or an AI pick (see choosePick).
 * Returns the pick on show, if any, and a way to close it early (the remote's Back or OK).
 */
export function usePickMoments({ pool, enabled, isBusy }: PickMomentsOptions) {
  const [pick, setPick] = useState<Pick | null>(null);
  // Read by the timer without restarting it.
  const latest = useRef({ pool, isBusy });
  latest.current = { pool, isBusy };
  const recent = useRef<string[]>([]);
  const lastKind = useRef<PickKind | null>(null);

  const showing = pick !== null;
  useEffect(() => {
    if (!enabled || showing) return;
    let timer: ReturnType<typeof setTimeout>;
    const look = (delay: number) => {
      timer = setTimeout(() => {
        if (latest.current.isBusy()) return look(PICK_TIMING.retryMs);
        const next = choosePick(latest.current.pool, recent.current, lastKind.current);
        if (!next) return look(PICK_TIMING.everyMs);
        recent.current = [next.photo.id, ...recent.current].slice(0, PICK_RULES.rememberLast);
        lastKind.current = next.kind;
        setPick(next);
      }, delay);
    };
    look(recent.current.length === 0 ? PICK_TIMING.firstAfterMs : PICK_TIMING.everyMs);
    return () => clearTimeout(timer);
  }, [enabled, showing]);

  const dismiss = useCallback(() => setPick(null), []);
  useEffect(() => {
    if (!pick) return;
    const timer = setTimeout(dismiss, PICK_TIMING.showMs);
    return () => clearTimeout(timer);
  }, [dismiss, pick]);

  // Switched off, or the photo left the wall: close it.
  const gone = pick !== null && !pool.some((photo) => photo.id === pick.photo.id);
  if (pick && (!enabled || gone)) setPick(null);

  return { pick, dismiss };
}

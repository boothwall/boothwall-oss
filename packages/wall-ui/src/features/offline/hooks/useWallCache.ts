import type { WallId, WallSnapshotDTO } from "@boothwall/shared";
import { useEffect, useRef } from "react";

import type { KeyValueStore } from "#platform/storage";

import { SAVE_DEBOUNCE_MS } from "../constants/cache";
import { loadCachedWall, saveCachedWall } from "../data/wallCacheStore";
import type { CachedWall } from "../utils/wallCache";

export type WallCacheOptions = {
  /** No store, no cache: the wall behaves exactly as it did without one. */
  store: KeyValueStore | undefined;
  wallId: WallId;
  /**
   * The wall as last heard from the API, or null until a live snapshot has landed. Only live
   * data is saved, so a restored cache never refreshes its own timestamp.
   */
  live: WallSnapshotDTO | null;
  /** Called once at start-up with the saved wall, unless live data beat it. */
  onRestore: (cached: CachedWall) => void;
};

/** Keeps the last live wall on the device and hands it back on the next cold start. */
export function useWallCache({ store, wallId, live, onRestore }: WallCacheOptions) {
  const liveRef = useRef(live);
  liveRef.current = live;
  const restoreRef = useRef(onRestore);
  restoreRef.current = onRestore;

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    void loadCachedWall(store, wallId).then((cached) => {
      if (cached && !cancelled && !liveRef.current) restoreRef.current(cached);
    });
    return () => {
      cancelled = true;
    };
  }, [store, wallId]);

  useEffect(() => {
    if (!store || !live) return;
    const timer = setTimeout(() => void saveCachedWall(store, wallId, live), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [store, wallId, live]);
}

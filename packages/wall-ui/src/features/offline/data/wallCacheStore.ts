import type { WallId, WallSnapshotDTO } from "@boothwall/shared";

import type { KeyValueStore } from "#platform/storage";

import {
  type CachedWall,
  parseWallCache,
  serializeWallCache,
  wallCacheKey,
} from "../utils/wallCache";

/** A storage failure only costs the cache, never the wall: both calls swallow errors. */
export async function loadCachedWall(
  store: KeyValueStore,
  wallId: WallId,
): Promise<CachedWall | undefined> {
  try {
    return parseWallCache(await store.getItem(wallCacheKey(wallId)));
  } catch {
    return undefined;
  }
}

export async function saveCachedWall(
  store: KeyValueStore,
  wallId: WallId,
  snapshot: WallSnapshotDTO,
): Promise<void> {
  try {
    await store.setItem(wallCacheKey(wallId), serializeWallCache(snapshot, Date.now()));
  } catch {
    // Full or unavailable storage: the next save tries again.
  }
}

import { type WallId, type WallSnapshotDTO, wallSnapshotSchema } from "@boothwall/shared";

import { CACHE_KEY_PREFIX, CACHE_VERSION } from "../constants/cache";

/** The last wall a screen showed, kept so it can keep cycling while the API is out of reach. */
export type CachedWall = { snapshot: WallSnapshotDTO; savedAt: number };

/** One entry per wall, so a screen moved to another wall never shows the old one's photos. */
export const wallCacheKey = (wallId: WallId) => `${CACHE_KEY_PREFIX}.${wallId}`;

export const serializeWallCache = (snapshot: WallSnapshotDTO, savedAt: number) =>
  JSON.stringify({ version: CACHE_VERSION, savedAt, snapshot });

/**
 * Undefined for nothing stored, another version, unreadable JSON or a snapshot that no longer
 * matches the contract (the same check a live snapshot gets).
 */
export function parseWallCache(raw: string | null): CachedWall | undefined {
  if (!raw) return undefined;
  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof stored !== "object" || stored === null) return undefined;
  const { version, savedAt, snapshot } = stored as Record<string, unknown>;
  if (version !== CACHE_VERSION || typeof savedAt !== "number") return undefined;
  const parsed = wallSnapshotSchema.safeParse(snapshot);
  return parsed.success ? { snapshot: parsed.data, savedAt } : undefined;
}

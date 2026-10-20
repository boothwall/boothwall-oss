import type { WallId } from "@boothwall/shared";
import { and, eq, gte, inArray, isNull } from "drizzle-orm";

import { photos } from "@/db/schema";

/** Removed photos stay as rows until the purge; every read leaves them out. */
export const visible = isNull(photos.removedAt);

/** Every query that serves a wall is scoped to it. */
export const ofWall = (wallId: WallId) => eq(photos.wallId, wallId);

// The upload caps count these; the counts and the guarded insert share them.

/** Across walls: the per-client cap is about one client, wherever it uploads. */
export const byClientSince = (fingerprints: string[], since: Date) =>
  and(inArray(photos.ipHash, fingerprints), gte(photos.createdAt, since));

export const pendingOn = (wallId: WallId) =>
  and(ofWall(wallId), visible, eq(photos.status, "pending"));

export const createdOnSince = (wallId: WallId, since: Date) =>
  and(ofWall(wallId), gte(photos.createdAt, since));

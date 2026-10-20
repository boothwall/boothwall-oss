import type { PhotoStatus, WallId } from "@boothwall/shared";
import { and, count, eq } from "drizzle-orm";

import type { Db } from "@/db/client";
import { photos } from "@/db/schema";

import { byClientSince, createdOnSince, ofWall, pendingOn, visible } from "./photo.scopes";

/** Counts: upload limits, the wall's "Who's here" and the Control panel's overview. */
export const photoCountRepo = {
  async countRecentByIpHash(db: Db, fingerprints: string[], since: Date): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(photos)
      .where(byClientSince(fingerprints, since));
    return row?.value ?? 0;
  },

  async countCreatedSince(db: Db, wallId: WallId, since: Date): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(photos)
      .where(createdOnSince(wallId, since));
    return row?.value ?? 0;
  },

  async countPending(db: Db, wallId: WallId): Promise<number> {
    const [row] = await db.select({ value: count() }).from(photos).where(pendingOn(wallId));
    return row?.value ?? 0;
  },

  async countApprovedByTribe(db: Db, wallId: WallId): Promise<{ tribe: string; value: number }[]> {
    return db
      .select({ tribe: photos.tribe, value: count() })
      .from(photos)
      .where(and(ofWall(wallId), visible, eq(photos.status, "approved")))
      .groupBy(photos.tribe);
  },

  /** Every photo still kept, counted per status and category. */
  async countByStatusAndTribe(
    db: Db,
    wallId: WallId,
  ): Promise<{ status: PhotoStatus; tribe: string; value: number }[]> {
    return db
      .select({ status: photos.status, tribe: photos.tribe, value: count() })
      .from(photos)
      .where(and(ofWall(wallId), visible))
      .groupBy(photos.status, photos.tribe);
  },
};

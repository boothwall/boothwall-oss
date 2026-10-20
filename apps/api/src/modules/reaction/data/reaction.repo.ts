/** Reaction counts, kept as a JSON column on the photo. The only file in this module that talks to D1. */
import type { Reaction, WallId } from "@boothwall/shared";
import { and, eq, isNull, sql } from "drizzle-orm";

import type { Db } from "@/db/client";
import { photos } from "@/db/schema";

export const reactionRepo = {
  /**
   * Adds one tap in a single statement, so concurrent taps never lose a count. Only an
   * approved photo on this wall counts; anything else returns null.
   */
  async increment(
    db: Db,
    wallId: WallId,
    photoId: string,
    reaction: Reaction,
  ): Promise<string | null> {
    const path = `$.${reaction}`;
    const [row] = await db
      .update(photos)
      .set({
        reactions: sql`json_set(${photos.reactions}, ${path}, coalesce(json_extract(${photos.reactions}, ${path}), 0) + 1)`,
      })
      .where(
        and(
          eq(photos.wallId, wallId),
          eq(photos.id, photoId),
          eq(photos.status, "approved"),
          isNull(photos.removedAt),
        ),
      )
      .returning({ reactions: photos.reactions });
    return row?.reactions ?? null;
  },
};

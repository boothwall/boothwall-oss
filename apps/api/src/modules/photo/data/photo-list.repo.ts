import type { WallId } from "@boothwall/shared";
import { and, asc, desc, eq, getTableColumns, gt, lt, or, type SQL, sql } from "drizzle-orm";

import type { Db } from "@/db/client";
import { type PhotoRow, photos } from "@/db/schema";
import type { PhotoCursor, PhotoListFilter } from "@/modules/photo/domain/photo.types";

import { ofWall, visible } from "./photo.scopes";

/**
 * Category position in the live list, so "sort by category" follows the phone's picker.
 * Categories that were removed sort last.
 */
const categoryRank = (order: readonly string[]) =>
  order.length === 0
    ? sql<number>`0`
    : sql<number>`CASE ${photos.tribe} ${sql.join(
        order.map((id, rank) => sql`WHEN ${id} THEN ${rank}`),
        sql` `,
      )} ELSE ${order.length} END`;

/** `%` and `_` in a search are literal characters, not wildcards. */
const containing = (text: string) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** Rows after the cursor, in the same order the page was sorted by. */
const after = (
  sort: PhotoListFilter["sort"],
  cursor: PhotoCursor,
  rank: SQL<number>,
): SQL | undefined => {
  const at = new Date(cursor.createdAt);
  if (sort === "oldest") {
    return or(gt(photos.createdAt, at), and(eq(photos.createdAt, at), gt(photos.id, cursor.id)));
  }
  const newer = or(
    lt(photos.createdAt, at),
    and(eq(photos.createdAt, at), lt(photos.id, cursor.id)),
  );
  if (sort === "newest") return newer;
  return or(sql`${rank} > ${cursor.rank}`, and(sql`${rank} = ${cursor.rank}`, newer));
};

const orderFor = (sort: PhotoListFilter["sort"], rank: SQL<number>) => {
  if (sort === "oldest") return [asc(photos.createdAt), asc(photos.id)];
  const newest = [desc(photos.createdAt), desc(photos.id)];
  return sort === "category" ? [asc(rank), ...newest] : newest;
};

/** The Control panel's photo list: filters, the three sorts and cursor paging. */
export const photoListRepo = {
  /** Control panel list: one page in a stable order, plus its last row's category rank. */
  async list(
    db: Db,
    wallId: WallId,
    filter: PhotoListFilter,
  ): Promise<(PhotoRow & { rank: number })[]> {
    const { status, tribe, q, sort, cursor, limit, categoryOrder } = filter;
    const rank = categoryRank(categoryOrder);
    return db
      .select({ ...getTableColumns(photos), rank })
      .from(photos)
      .where(
        and(
          ofWall(wallId),
          visible,
          status ? eq(photos.status, status) : undefined,
          tribe ? eq(photos.tribe, tribe) : undefined,
          q ? sql`${photos.caption} LIKE ${containing(q)} ESCAPE '\\'` : undefined,
          cursor ? after(sort, cursor, rank) : undefined,
        ),
      )
      .orderBy(...orderFor(sort, rank))
      .limit(limit);
  },
};

/**
 * Photo rows: finding, writing and removing them. With photo-list.repo and photo-count.repo,
 * the only files in this module that talk to D1. Queries for a wall take its id; the
 * retention purge and the per-client upload count deliberately span all walls.
 */
import type { PhotoStatus, WallId } from "@boothwall/shared";
import { and, desc, eq, getTableColumns, lt, type SQL, sql } from "drizzle-orm";

import type { Db } from "@/db/client";
import { type NewPhotoRow, type PhotoRow, photos } from "@/db/schema";

import { byClientSince, createdOnSince, ofWall, pendingOn, visible } from "./photo.scopes";
import { photoCountRepo } from "./photo-count.repo";
import { photoListRepo } from "./photo-list.repo";

/** The upload caps a new photo is admitted under: a count since a time, below a maximum. */
export type PhotoAdmissionCaps = {
  fingerprints: string[];
  clientWindow: { since: Date; max: number };
  clientDaily: { since: Date; max: number };
  wallPending: number;
  wallDaily: { since: Date; max: number };
};

export const photoRepo = {
  ...photoListRepo,
  ...photoCountRepo,
  async findByStatus(
    db: Db,
    wallId: WallId,
    status: PhotoStatus,
    limit: number,
  ): Promise<PhotoRow[]> {
    return db
      .select()
      .from(photos)
      .where(and(ofWall(wallId), visible, eq(photos.status, status)))
      .orderBy(desc(status === "approved" ? photos.approvedAt : photos.createdAt))
      .limit(limit);
  },

  async findById(db: Db, wallId: WallId, id: string): Promise<PhotoRow | undefined> {
    const [row] = await db
      .select()
      .from(photos)
      .where(and(ofWall(wallId), eq(photos.id, id)))
      .limit(1);
    return row;
  },

  async findCreatedBefore(db: Db, cutoff: Date): Promise<PhotoRow[]> {
    return db.select().from(photos).where(lt(photos.createdAt, cutoff));
  },

  /**
   * Inserts the row only while every upload cap still has room, in one statement, so uploads
   * arriving together can't all pass a count taken before any of them was written.
   * Null when a cap is full.
   */
  async createIfUnder(
    db: Db,
    row: NewPhotoRow & { wallId: WallId },
    caps: PhotoAdmissionCaps,
  ): Promise<PhotoRow | null> {
    const columns = getTableColumns(photos);
    const values = Object.entries(row).flatMap(([key, value]) =>
      value === undefined ? [] : [{ column: columns[key as keyof typeof columns], value }],
    );
    const under = (where: SQL | undefined, max: number) =>
      sql`(SELECT count(*) FROM ${photos} WHERE ${where}) < ${max}`;
    const inserted = await db.get<{ id: string } | undefined>(sql`
      INSERT INTO ${photos} (${sql.join(
        values.map(({ column }) => sql.identifier(column.name)),
        sql`, `,
      )})
      SELECT ${sql.join(
        values.map(({ column, value }) => sql.param(value, column)),
        sql`, `,
      )}
      WHERE ${under(byClientSince(caps.fingerprints, caps.clientWindow.since), caps.clientWindow.max)}
        AND ${under(byClientSince(caps.fingerprints, caps.clientDaily.since), caps.clientDaily.max)}
        AND ${under(pendingOn(row.wallId), caps.wallPending)}
        AND ${under(createdOnSince(row.wallId, caps.wallDaily.since), caps.wallDaily.max)}
      RETURNING id`);
    if (!inserted) return null;
    const [created] = await db.select().from(photos).where(eq(photos.id, inserted.id)).limit(1);
    if (!created) throw new Error("Photo insert returned no row");
    return created;
  },

  /** `onlyIf` approves only from that status, in the same statement (no race with a person). */
  async approve(
    db: Db,
    wallId: WallId,
    id: string,
    approvedAt: Date,
    onlyIf?: PhotoStatus,
  ): Promise<PhotoRow | undefined> {
    const [row] = await db
      .update(photos)
      .set({ status: "approved", approvedAt })
      .where(
        and(
          ofWall(wallId),
          eq(photos.id, id),
          visible,
          onlyIf ? eq(photos.status, onlyIf) : undefined,
        ),
      )
      .returning();
    return row;
  },

  async update(
    db: Db,
    wallId: WallId,
    id: string,
    values: Partial<Pick<PhotoRow, "caption" | "tribe" | "status" | "approvedAt" | "keep">>,
  ): Promise<PhotoRow | undefined> {
    const [row] = await db
      .update(photos)
      .set(values)
      .where(and(ofWall(wallId), eq(photos.id, id), visible))
      .returning();
    return row;
  },

  async setRemoved(db: Db, wallId: WallId, id: string, removedAt: Date): Promise<void> {
    await db
      .update(photos)
      .set({ removedAt })
      .where(and(ofWall(wallId), eq(photos.id, id)));
  },

  async deleteById(db: Db, id: string): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  },
};

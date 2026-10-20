import { safeEqual } from "@/core/security/crypto";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import { photoCursor } from "./photo.cursor";
import { photoNotFound, photoStatusForbidden } from "./photo.errors";
import { toPhotoStats } from "./photo.formatters";
import type {
  ControlPhotoDTO,
  GuestPhotoStatusDTO,
  ImageVariant,
  ListPhotosArgs,
  PhotoDeps,
  PhotoPageDTO,
  PhotoStatsDTO,
  WallSnapshotDTO,
} from "./photo.types";
import {
  holdsDeleteToken,
  privateSignature,
  toControlDTOs,
  toWallDTOs,
  wallStats,
} from "./photo.views";

/** Reading photos: the wall's snapshot, the Control panel's lists and counts, and the images. */
export const photoQueryService = {
  /** Approved photos only, i.e. what the TV wall shows. */
  async getWall(deps: PhotoDeps, limit: number): Promise<Omit<WallSnapshotDTO, "settings">> {
    const rows = await photoRepo.findByStatus(deps.db, deps.wallId, "approved", limit);
    const [photos, stats] = await Promise.all([
      toWallDTOs(rows, deps),
      wallStats(deps.db, deps.wallId),
    ]);
    return { photos, stats };
  },

  /** Booth view: photos waiting for approval, oldest first so nobody waits too long. */
  async getPending(deps: PhotoDeps, limit: number): Promise<ControlPhotoDTO[]> {
    const rows = await photoRepo.findByStatus(deps.db, deps.wallId, "pending", limit);
    return toControlDTOs(rows.reverse(), deps);
  },

  /** Control panel list: every kept photo, filtered, sorted and paged by cursor. */
  async list(deps: PhotoDeps, { cursor, ...filter }: ListPhotosArgs): Promise<PhotoPageDTO> {
    const rows = await photoRepo.list(deps.db, deps.wallId, {
      ...filter,
      cursor: cursor ? photoCursor.decode(filter.sort, cursor) : undefined,
      // One extra row says whether there is another page.
      limit: filter.limit + 1,
    });
    const page = rows.slice(0, filter.limit);
    const last = page.at(-1);
    return {
      photos: await toControlDTOs(page, deps),
      nextCursor:
        rows.length > filter.limit && last
          ? photoCursor.encode(filter.sort, {
              rank: last.rank,
              createdAt: last.createdAt.getTime(),
              id: last.id,
            })
          : null,
    };
  },

  /** Counts for the Control panel's overview; "today" starts at `since`. */
  async stats({ db, wallId }: PhotoDeps, since: Date): Promise<PhotoStatsDTO> {
    const [counts, uploadsToday] = await Promise.all([
      photoRepo.countByStatusAndTribe(db, wallId),
      photoRepo.countCreatedSince(db, wallId, since),
    ]);
    return toPhotoStats(counts, uploadsToday);
  },

  /**
   * The sender's view of their photo: waiting, live, or declined once removed or hidden. The
   * delete token is checked before anything is said, so no one learns another photo's state.
   */
  async guestStatus(
    { db, wallId }: PhotoDeps,
    id: string,
    deleteToken: string | undefined,
  ): Promise<GuestPhotoStatusDTO> {
    const row = await photoRepo.findById(db, wallId, id);
    if (!row) throw photoNotFound({ id });
    if (!(await holdsDeleteToken(row, deleteToken))) throw photoStatusForbidden({ id });
    if (row.removedAt || row.status === "hidden") return { state: "declined" };
    return { state: row.status === "approved" ? "live" : "waiting" };
  },

  /**
   * Approved images are public; pending and hidden ones need the Control panel's signed link.
   * A thumbnail request for a photo stored without one gets the full image.
   */
  async getImage(
    { db, bucket, wallId, signingKey }: PhotoDeps,
    id: string,
    signature: string | undefined,
    variant: ImageVariant = "image",
  ): Promise<{ object: R2ObjectBody; contentType: string; approved: boolean }> {
    const row = await photoRepo.findById(db, wallId, id);
    if (!row || row.removedAt) throw photoNotFound({ id });
    const approved = row.status === "approved";
    if (!approved && !(signature && safeEqual(signature, await privateSignature(signingKey, id)))) {
      throw photoNotFound({ id });
    }
    if (variant === "thumb" && row.thumbKey) {
      const thumb = await photoStorageRepo.get(bucket, row.thumbKey);
      const thumbType = thumb?.httpMetadata?.contentType;
      if (thumb && thumbType) return { object: thumb, contentType: thumbType, approved };
    }
    const object = await photoStorageRepo.get(bucket, row.objectKey);
    if (!object) throw photoNotFound({ id });
    return { object, contentType: row.contentType, approved };
  },
};

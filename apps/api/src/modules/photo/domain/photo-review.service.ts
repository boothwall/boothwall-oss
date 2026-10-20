import { photoRepo } from "@/modules/photo/data/photo.repo";

import { photoCategoryUnknown, photoDeleteForbidden, photoNotFound } from "./photo.errors";
import { toPhotoDTO } from "./photo.formatters";
import type {
  ControlPhotoDTO,
  PhotoDeps,
  PhotoDTO,
  RemovePhotoArgs,
  UpdatePhotoArgs,
} from "./photo.types";
import {
  announce,
  DAY_MS,
  deleteObjects,
  holdsDeleteToken,
  toControlDTOs,
  wallStats,
} from "./photo.views";

/** What hosts and the smart check decide about a photo: approve, edit, hide, remove, expire. */
export const photoReviewService = {
  /**
   * Edits from the Control panel. The wall follows live: hiding sends `photo.removed`,
   * showing again sends `photo.created` and an edit to a photo on the wall `photo.updated`.
   * Showing a hidden photo approves it, whether or not it had been approved before.
   * `categoryIds` is the live list; a changed category must be one of them.
   */
  async update(
    deps: PhotoDeps,
    id: string,
    patch: UpdatePhotoArgs,
    categoryIds: readonly string[],
  ): Promise<ControlPhotoDTO> {
    const { db, wall, wallId } = deps;
    const existing = await photoRepo.findById(db, wallId, id);
    if (!existing || existing.removedAt) throw photoNotFound({ id });
    // Only a change is checked: a photo whose category was removed can still be edited.
    const newTribe = patch.tribe !== undefined && patch.tribe !== existing.tribe;
    if (newTribe && !categoryIds.includes(patch.tribe ?? "")) {
      throw photoCategoryUnknown({ tribe: patch.tribe ?? "" });
    }

    const status =
      patch.hidden === true
        ? "hidden"
        : patch.hidden === false && existing.status === "hidden"
          ? "approved"
          : existing.status;
    const row = await photoRepo.update(db, wallId, id, {
      ...(patch.caption !== undefined && { caption: patch.caption }),
      ...(patch.tribe !== undefined && { tribe: patch.tribe }),
      ...(patch.keep !== undefined && { keep: patch.keep }),
      status,
      ...(status === "approved" &&
        !existing.approvedAt && { approvedAt: deps.now?.() ?? new Date() }),
    });
    if (!row) throw photoNotFound({ id });

    const wasOnWall = existing.status === "approved";
    const onWall = row.status === "approved";
    const edited = row.caption !== existing.caption || row.tribe !== existing.tribe;
    if (wasOnWall && !onWall) {
      await wall.broadcast({
        type: "photo.removed",
        photoId: id,
        stats: await wallStats(db, wallId),
      });
    } else if (!wasOnWall && onWall) {
      const photo = toPhotoDTO(row, deps.sharedEventOrigin ?? deps.origin);
      await wall.broadcast({ type: "photo.created", photo, stats: await wallStats(db, wallId) });
    } else if (onWall && edited) {
      const photo = toPhotoDTO(row, deps.sharedEventOrigin ?? deps.origin);
      await wall.broadcast({ type: "photo.updated", photo, stats: await wallStats(db, wallId) });
    }
    const [photo] = await toControlDTOs([row], deps);
    if (!photo) throw photoNotFound({ id });
    return photo;
  },

  async approve(deps: PhotoDeps, id: string): Promise<PhotoDTO> {
    const { db, wallId, origin } = deps;
    const existing = await photoRepo.findById(db, wallId, id);
    if (!existing || existing.removedAt) throw photoNotFound({ id });
    if (existing.status === "approved") return toPhotoDTO(existing, origin);

    const row = await photoRepo.approve(db, wallId, id, deps.now?.() ?? new Date());
    if (!row) throw photoNotFound({ id });
    return announce(deps, row);
  },

  /**
   * Approval by smart moderation. Only a photo still waiting is approved:
   * if a person approved, hid or removed it in the meantime, that decision stands.
   */
  async approvePending(deps: PhotoDeps, id: string): Promise<boolean> {
    const now = deps.now?.() ?? new Date();
    const row = await photoRepo.approve(deps.db, deps.wallId, id, now, "pending");
    if (!row) return false;
    await announce(deps, row);
    return true;
  },

  async remove(deps: PhotoDeps, { id, deleteToken, isAdmin }: RemovePhotoArgs): Promise<void> {
    const { db, bucket, wall, wallId } = deps;
    const row = await photoRepo.findById(db, wallId, id);
    if (!row || row.removedAt) throw photoNotFound({ id });

    if (!isAdmin && !(await holdsDeleteToken(row, deleteToken))) throw photoDeleteForbidden({ id });

    await photoRepo.setRemoved(db, wallId, id, deps.now?.() ?? new Date());
    await deleteObjects(bucket, row);
    if (row.status === "approved") {
      await wall.broadcast({
        type: "photo.removed",
        photoId: id,
        stats: await wallStats(db, wallId),
      });
    }
  },

  /** Hard-deletes photos (row + image) older than the retention window. Idempotent. */
  async purgeExpired(
    { db, bucket }: Pick<PhotoDeps, "db" | "bucket">,
    { retentionDays, now = new Date() }: { retentionDays: number; now?: Date },
  ): Promise<number> {
    const old = await photoRepo.findCreatedBefore(
      db,
      new Date(now.getTime() - retentionDays * DAY_MS),
    );
    const expired = old.filter((row) => !row.keep);
    for (const row of expired) {
      await deleteObjects(bucket, row);
      await photoRepo.deleteById(db, row.id);
    }
    return expired.length;
  },
};

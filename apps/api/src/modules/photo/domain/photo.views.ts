import type { WallId, WallStatsDTO } from "@boothwall/shared";

import { hmacHex, safeEqual, sha256Hex } from "@/core/security/crypto";
import type { Db } from "@/db/client";
import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import { toPhotoDTO, toWallStats } from "./photo.formatters";
import type { ControlPhotoDTO, PhotoDeps, PhotoDTO } from "./photo.types";

// What the photo services share: how a row is shown to the Control panel and to the walls,
// the wall's counts, and removing a photo's stored images.

export const DAY_MS = 24 * 60 * 60 * 1000;

/** The image and its thumbnail, if it has one. */
export const deleteObjects = async (bucket: R2Bucket, row: PhotoRow) => {
  await photoStorageRepo.delete(bucket, row.objectKey);
  if (row.thumbKey) await photoStorageRepo.delete(bucket, row.thumbKey);
};

export const wallStats = async (db: Db, wallId: WallId): Promise<WallStatsDTO> =>
  toWallStats(await photoRepo.countApprovedByTribe(db, wallId));

/** Whether `deleteToken` is the one handed to the guest who sent the photo. */
export const holdsDeleteToken = async (row: PhotoRow, deleteToken: string | undefined) =>
  deleteToken !== undefined && safeEqual(await sha256Hex(deleteToken), row.deleteTokenHash);

/**
 * Short HMAC so only the Control panel can open images that aren't on the wall (pending or
 * hidden). The message predates hidden photos; keeping it keeps issued links valid.
 */
export const privateSignature = async (key: string, id: string) =>
  (await hmacHex(key, `pending-image:${id}`)).slice(0, 32);

/**
 * Control panel view of rows: images that aren't public get a signed link, and every photo
 * carries its smart moderation verdict (fetched for the whole list at once).
 */
export const toControlDTOs = async (
  rows: PhotoRow[],
  deps: PhotoDeps,
): Promise<ControlPhotoDTO[]> => {
  const analyses = (await deps.analyses?.forPhotos(rows.map((row) => row.id))) ?? new Map();
  return Promise.all(
    rows.map(async (row) => ({
      ...toPhotoDTO(
        row,
        deps.origin,
        row.status === "approved" ? undefined : await privateSignature(deps.signingKey, row.id),
      ),
      analysis: analyses.get(row.id) ?? null,
    })),
  );
};

/**
 * Wall view of approved rows: public links, plus the smart check's highlight score (for the
 * wall's "AI pick") when the photo was checked. Nothing else from the verdict leaves the API.
 */
export const toWallDTOs = async (rows: PhotoRow[], deps: PhotoDeps): Promise<PhotoDTO[]> => {
  const analyses = (await deps.analyses?.forPhotos(rows.map((row) => row.id))) ?? new Map();
  return rows.map((row) => {
    const highlight = analyses.get(row.id)?.highlight;
    return {
      ...toPhotoDTO(row, deps.origin),
      ...(typeof highlight === "number" && { highlight }),
    };
  });
};

/** A photo just reached the wall: every screen adds it. */
export const announce = async (deps: PhotoDeps, row: PhotoRow) => {
  const [photo = toPhotoDTO(row, deps.origin)] = await toWallDTOs([row], deps);
  await deps.wall.broadcast({
    type: "photo.created",
    photo: { ...photo, ...toPhotoDTO(row, deps.sharedEventOrigin ?? deps.origin) },
    stats: await wallStats(deps.db, deps.wallId),
  });
  return photo;
};

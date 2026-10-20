import type { WallId } from "@boothwall/shared";

import type { Db } from "@/db/client";
import { type PhotoAdmissionCaps, photoRepo } from "@/modules/photo/data/photo.repo";

import { photoRateLimited, photoWallBusy } from "./photo.errors";
import { DAY_MS } from "./photo.views";

/**
 * Upload limits, sized for venue Wi-Fi where hundreds of people share one IP: the
 * per-client caps only stop scripts. The wall-wide caps bound storage and cost no matter how
 * many IPs an abuser has (5,000 photos of at most 3 MB is under 15 GB, cents on R2).
 */
export const UPLOAD_LIMITS = {
  perClient: { maxUploads: 60, windowMs: 10 * 60 * 1000 },
  perClientDaily: 500,
  globalDaily: 5000,
  maxPending: 300,
};

/** The caps one upload is admitted under, measured back from `now`. */
export const uploadCaps = (fingerprints: string[], now: Date): PhotoAdmissionCaps => {
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const { perClient } = UPLOAD_LIMITS;
  return {
    fingerprints,
    clientWindow: {
      since: new Date(now.getTime() - perClient.windowMs),
      max: perClient.maxUploads,
    },
    clientDaily: { since: dayAgo, max: UPLOAD_LIMITS.perClientDaily },
    wallPending: UPLOAD_LIMITS.maxPending,
    wallDaily: { since: dayAgo, max: UPLOAD_LIMITS.globalDaily },
  };
};

/**
 * Throws for the first full cap, per-client before wall-wide. A cheap early refusal: only the
 * guarded insert (`photoRepo.createIfUnder`) decides, because uploads arriving together all
 * pass these counts.
 */
export async function refuseWhenFull(db: Db, wallId: WallId, caps: PhotoAdmissionCaps) {
  const { fingerprints, clientWindow, clientDaily, wallDaily } = caps;
  if (
    (await photoRepo.countRecentByIpHash(db, fingerprints, clientWindow.since)) >= clientWindow.max
  ) {
    throw photoRateLimited({ retryAfterSeconds: UPLOAD_LIMITS.perClient.windowMs / 1000 });
  }
  if (
    (await photoRepo.countRecentByIpHash(db, fingerprints, clientDaily.since)) >= clientDaily.max
  ) {
    throw photoRateLimited({ retryAfterSeconds: DAY_MS / 1000 });
  }
  if (
    (await photoRepo.countPending(db, wallId)) >= caps.wallPending ||
    (await photoRepo.countCreatedSince(db, wallId, wallDaily.since)) >= wallDaily.max
  ) {
    throw photoWallBusy({ retryAfterSeconds: 15 * 60 });
  }
}

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import { jpeg, makeDeps, POLICY, row } from "./photo.fixtures";
import { photoUploadService } from "./photo-upload.service";
import { UPLOAD_LIMITS } from "./upload-limits";

const defaults = structuredClone(UPLOAD_LIMITS);
afterEach(() => {
  Object.assign(UPLOAD_LIMITS, structuredClone(defaults));
  vi.restoreAllMocks();
});

/**
 * A photos table in memory: the counts read what the inserts wrote, and the guarded insert
 * checks and writes in one step, as one D1 statement does.
 */
let rows: PhotoRow[];
const count = {
  client: (fingerprints: string[], since: Date) =>
    rows.filter((r) => fingerprints.includes(r.ipHash) && r.createdAt >= since).length,
  pending: (wallId: string) =>
    rows.filter((r) => r.wallId === wallId && r.status === "pending" && !r.removedAt).length,
  wall: (wallId: string, since: Date) =>
    rows.filter((r) => r.wallId === wallId && r.createdAt >= since).length,
};
beforeEach(() => {
  rows = [];
  vi.spyOn(photoRepo, "countRecentByIpHash").mockImplementation(async (_db, fps, since) =>
    count.client(fps, since),
  );
  vi.spyOn(photoRepo, "countPending").mockImplementation(async (_db, wallId) =>
    count.pending(wallId),
  );
  vi.spyOn(photoRepo, "countCreatedSince").mockImplementation(async (_db, wallId, since) =>
    count.wall(wallId, since),
  );
  vi.spyOn(photoRepo, "createIfUnder").mockImplementation(async (_db, values, caps) => {
    if (
      count.client(caps.fingerprints, caps.clientWindow.since) >= caps.clientWindow.max ||
      count.client(caps.fingerprints, caps.clientDaily.since) >= caps.clientDaily.max ||
      count.pending(values.wallId) >= caps.wallPending ||
      count.wall(values.wallId, caps.wallDaily.since) >= caps.wallDaily.max
    )
      return null;
    const created = row(values as PhotoRow);
    rows.push(created);
    return created;
  });
});

/**
 * Starts every upload together and holds each at its storage write until all of them have
 * either reached it or been refused, so every limit check runs before any row is written.
 */
async function admitTogether(clientIps: string[]) {
  let arrived = 0;
  let open!: () => void;
  const gate = new Promise<void>((resolve) => (open = resolve));
  const arrive = () => {
    if (++arrived === clientIps.length) open();
  };
  const objects = new Set<string>();
  vi.spyOn(photoStorageRepo, "put").mockImplementation(async (_bucket, key) => {
    objects.add(key);
    arrive();
    await gate;
  });
  vi.spyOn(photoStorageRepo, "delete").mockImplementation(async (_bucket, key) => {
    objects.delete(key);
  });
  const { deps } = makeDeps();
  const results = await Promise.allSettled(
    clientIps.map((clientIp, i) =>
      photoUploadService
        .upload(deps, {
          image: jpeg(),
          caption: `guest ${i}`,
          tribe: POLICY.categoryIds[0]!,
          clientIp,
          policy: POLICY,
        })
        .catch((error: unknown) => {
          arrive();
          throw error;
        }),
    ),
  );
  return {
    objects: [...objects].sort(),
    admitted: results.filter((r) => r.status === "fulfilled").length,
    refused: results.flatMap((r) =>
      r.status === "rejected" ? [(r.reason as { code?: string }).code] : [],
    ),
  };
}

const oneClient = Array.from({ length: 5 }, () => "198.51.100.7");
const manyClients = Array.from({ length: 5 }, (_, i) => `198.51.100.${i + 10}`);

it("stops at a lowered cap when uploads arrive one after another (control)", async () => {
  UPLOAD_LIMITS.perClient.maxUploads = 2;
  const { deps } = makeDeps();
  vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
  const upload = () =>
    photoUploadService.upload(deps, {
      image: jpeg(),
      caption: null,
      tribe: POLICY.categoryIds[0]!,
      clientIp: oneClient[0]!,
      policy: POLICY,
    });
  await upload();
  await upload();
  await expect(upload()).rejects.toMatchObject({ code: "PHOTO_RATE_LIMITED" });
  expect(rows).toHaveLength(2);
});

it.each([
  {
    cap: "per-client burst",
    clients: oneClient,
    lower: () => void (UPLOAD_LIMITS.perClient.maxUploads = 2),
    code: "PHOTO_RATE_LIMITED",
  },
  {
    cap: "per-client daily",
    clients: oneClient,
    lower: () => void (UPLOAD_LIMITS.perClientDaily = 2),
    code: "PHOTO_RATE_LIMITED",
  },
  {
    cap: "wall pending queue",
    clients: manyClients,
    lower: () => void (UPLOAD_LIMITS.maxPending = 2),
    code: "PHOTO_WALL_BUSY",
  },
  {
    cap: "wall daily",
    clients: manyClients,
    lower: () => void (UPLOAD_LIMITS.globalDaily = 2),
    code: "PHOTO_WALL_BUSY",
  },
])("admits at most the $cap cap when uploads arrive together", async ({ clients, lower, code }) => {
  lower();
  const { objects, admitted, refused } = await admitTogether(clients);
  expect({ admitted, stored: rows.length, refused }).toEqual({
    admitted: 2,
    stored: 2,
    refused: [code, code, code],
  });
  // The losers wrote their image before the insert refused them; it is removed again.
  expect(objects).toEqual(rows.map((r) => r.objectKey).sort());
});

import {
  type ControlPhotoDTO,
  DEFAULT_WALL_ID,
  type PhotoDTO,
  type Tribe,
} from "@boothwall/shared";
import { vi } from "vitest";

import type { Db } from "@/db/client";
import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";

import type { PhotoDeps } from "./photo.types";

// Test data shared by the photo service tests.

/** Any two categories from the config; the service doesn't care which. */
export const A_TRIBE = "fire-tv";
export const B_TRIBE: Tribe = "visiting";
export const CATEGORY_IDS = [A_TRIBE, B_TRIBE];
export const POLICY = { autoApprove: false, categoryIds: CATEGORY_IDS };

export const now = new Date("2026-10-07T12:00:00.000Z");

/** What the walls get of a Control panel photo: everything but the smart moderation verdict. */
export const wallView = (photo: ControlPhotoDTO): PhotoDTO =>
  Object.fromEntries(Object.entries(photo).filter(([key]) => key !== "analysis")) as PhotoDTO;

export const makeDeps = () => {
  const broadcast = vi.fn().mockResolvedValue(undefined);
  const deps: PhotoDeps = {
    db: {} as Db,
    wallId: DEFAULT_WALL_ID,
    bucket: {} as R2Bucket,
    wall: { broadcast },
    origin: "https://api.test",
    fingerprintKey: "fixture-only-client-fingerprint-key-32",
    signingKey: "test-signing-key",
    now: () => now,
  };
  return { deps, broadcast };
};

export { jpeg } from "@/testing/photo-image.fixtures";

export const row = (overrides: Partial<PhotoRow> = {}): PhotoRow => ({
  id: "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d001",
  wallId: DEFAULT_WALL_ID,
  caption: "Hi Berlin",
  tribe: A_TRIBE,
  status: "approved",
  objectKey: "photos/x",
  contentType: "image/jpeg",
  thumbKey: null,
  ipHash: "h",
  deleteTokenHash: "not-a-real-hash",
  createdAt: now,
  approvedAt: now,
  removedAt: null,
  keep: false,
  reactions: "{}",
  ...overrides,
});

/** Every limit has room unless a test says otherwise. */
export const underLimits = () => {
  vi.spyOn(photoRepo, "countRecentByIpHash").mockResolvedValue(0);
  vi.spyOn(photoRepo, "countPending").mockResolvedValue(0);
  vi.spyOn(photoRepo, "countCreatedSince").mockResolvedValue(0);
};

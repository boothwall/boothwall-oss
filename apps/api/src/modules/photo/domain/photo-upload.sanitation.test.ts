import { createHash } from "node:crypto";

import { afterEach, expect, it, vi } from "vitest";

import type { PhotoRow } from "@/db/schema";
import {
  exifJpeg,
  imageFile,
  imageFixture,
  privatePng,
  privateWebp,
} from "@/testing/photo-image.fixtures";

import { photoRepo } from "../data/photo.repo";
import { photoStorageRepo } from "../data/photo-storage.repo";
import { makeDeps, POLICY, row, underLimits } from "./photo.fixtures";
import { toPhotoDTO } from "./photo.formatters";
import { photoUploadService } from "./photo-upload.service";

const args = (bytes: Uint8Array) => ({
  image: imageFile(bytes),
  thumb: imageFile(bytes),
  caption: "Hello",
  tribe: POLICY.categoryIds[0]!,
  operationId: "sanitation-fixture",
  clientIp: "192.0.2.10",
  policy: POLICY,
});
afterEach(() => vi.restoreAllMocks());

it("stores clean original and thumbnail lengths while retaining the submitted payload identity", async () => {
  const { deps } = makeDeps();
  underLimits();
  vi.spyOn(photoRepo, "createIfUnder").mockImplementation(async (_db, values) =>
    row(values as PhotoRow),
  );
  const writes: Uint8Array[] = [];
  vi.spyOn(photoStorageRepo, "put").mockImplementation(async (_bucket, _key, bytes) => {
    writes.push(new Uint8Array(bytes));
  });
  let admission: unknown;
  deps.uploadLifecycle = {
    replay: async () => null,
    begin: async (input) => {
      admission = input;
      return { photoId: "clean-photo", deleteToken: "fixture-token" };
    },
    failed: async () => {},
  };
  const submitted = exifJpeg(),
    clean = imageFixture("baseline.jpg");
  await photoUploadService.upload(deps, args(submitted));
  expect(writes).toEqual([clean, clean]);
  const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
  const hash = sha(
    JSON.stringify([sha(submitted), sha(submitted), "Hello", POLICY.categoryIds[0]]),
  );
  expect(admission).toMatchObject({
    payloadHash: hash,
    mediaBytes: { original: clean.length, thumbnail: clean.length },
  });
});

it("refuses unexplained trailing bytes on a fresh image before reservation or storage", async () => {
  const { deps } = makeDeps();
  underLimits();
  const begin = vi.fn(async () => ({ photoId: "new", deleteToken: "fixture" }));
  const put = vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
  vi.spyOn(photoRepo, "createIfUnder").mockImplementation(async (_db, values) =>
    row(values as PhotoRow),
  );
  deps.uploadLifecycle = { replay: async () => null, begin, failed: async () => {} };
  await expect(
    photoUploadService.upload(
      deps,
      args(
        new Uint8Array([
          ...imageFixture("baseline.jpg"),
          ...new TextEncoder().encode("PRIVATE_TRAILER"),
        ]),
      ),
    ),
  ).rejects.toMatchObject({ code: "PHOTO_UNSUPPORTED_TYPE" });
  expect(begin).not.toHaveBeenCalled();
  expect(put).not.toHaveBeenCalled();
});

it("replays an authorized old receipt before newly strict orientation and policy checks", async () => {
  const { deps } = makeDeps();
  const put = vi.spyOn(photoStorageRepo, "put"),
    begin = vi.fn();
  deps.uploadLifecycle = {
    replay: async () => ({ photo: toPhotoDTO(row(), deps.origin), deleteToken: "original-token" }),
    begin,
    failed: async () => {},
  };
  const result = await photoUploadService.upload(deps, {
    ...args(exifJpeg(6)),
    policy: { uploadsOpen: false, autoApprove: false, categoryIds: [] },
  });
  expect(result).toMatchObject({ replayed: true, deleteToken: "original-token" });
  expect(begin).not.toHaveBeenCalled();
  expect(put).not.toHaveBeenCalled();
});

it.each([
  { name: "PNG", type: "image/png", input: privatePng, clean: "alpha.png" as const },
  { name: "WebP", type: "image/webp", input: privateWebp, clean: "alpha.webp" as const },
])(
  "strips private metadata from both $name blobs without changing color/alpha bytes",
  async ({ type, input, clean }) => {
    const { deps } = makeDeps();
    underLimits();
    vi.spyOn(photoRepo, "createIfUnder").mockImplementation(async (_db, values) =>
      row(values as PhotoRow),
    );
    const writes: Uint8Array[] = [];
    vi.spyOn(photoStorageRepo, "put").mockImplementation(async (_bucket, _key, bytes) => {
      writes.push(new Uint8Array(bytes));
    });
    const source = input();
    await photoUploadService.upload(deps, {
      ...args(source),
      image: imageFile(source, type),
      thumb: imageFile(source, type),
    });
    expect(writes).toEqual([imageFixture(clean), imageFixture(clean)]);
  },
);

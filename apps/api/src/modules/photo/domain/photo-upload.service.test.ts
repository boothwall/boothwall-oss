import { PHOTO_LIMITS } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import {
  PHOTO_DIMENSIONS_TOO_LARGE,
  PHOTO_RATE_LIMITED,
  PHOTO_TOO_LARGE,
  PHOTO_UNSUPPORTED_TYPE,
  PHOTO_WALL_BUSY,
} from "./photo.errors";
import {
  A_TRIBE,
  B_TRIBE,
  CATEGORY_IDS,
  jpeg,
  makeDeps,
  now,
  POLICY,
  row,
  underLimits,
} from "./photo.fixtures";
import { photoReviewService } from "./photo-review.service";
import { photoUploadService } from "./photo-upload.service";

afterEach(() => vi.restoreAllMocks());

describe("photoUploadService.upload", () => {
  it("stores the image and saves a pending row without touching the wall", async () => {
    const { deps, broadcast } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
    vi.spyOn(photoRepo, "createIfUnder").mockImplementation(async (_db, values) =>
      row(values as PhotoRow),
    );
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

    const result = await photoUploadService.upload(deps, {
      image: jpeg(),
      caption: "Hi Berlin",
      tribe: A_TRIBE,
      clientIp: "1.2.3.4",
      policy: POLICY,
    });

    expect(put).toHaveBeenCalledOnce();
    expect(result.deleteToken).toMatch(/^[0-9a-f]{48}$/);
    expect(result.photo.imageUrl).toBe(`https://api.test/photos/${result.photo.id}/image`);
    expect(result.photo.thumbUrl).toBe(result.photo.imageUrl);
    expect(result.photo.status).toBe("pending");
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("puts an auto-approved upload straight on the wall", async () => {
    const { deps, broadcast } = makeDeps();
    underLimits();
    vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
    const create = vi
      .spyOn(photoRepo, "createIfUnder")
      .mockImplementation(async (_db, values) => row(values as PhotoRow));
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

    const result = await photoUploadService.upload(deps, {
      image: jpeg(),
      caption: null,
      tribe: A_TRIBE,
      clientIp: "1.2.3.4",
      policy: { ...POLICY, autoApprove: true },
    });

    expect(create.mock.calls[0]?.[1]).toMatchObject({ status: "approved", approvedAt: now });
    expect(result.photo.status).toBe("approved");
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: "photo.created" }));
  });

  it("refuses a category that isn't in the live list", async () => {
    const { deps } = makeDeps();
    const put = vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
    await expect(
      photoUploadService.upload(deps, {
        image: jpeg(),
        caption: null,
        tribe: "retired-category",
        clientIp: "1.2.3.4",
        policy: POLICY,
      }),
    ).rejects.toMatchObject({ code: "PHOTO_CATEGORY_UNKNOWN" });
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    await expect(
      photoReviewService.update(deps, row().id, { tribe: "retired-category" }, CATEGORY_IDS),
    ).rejects.toMatchObject({ code: "PHOTO_CATEGORY_UNKNOWN" });
    expect(put).not.toHaveBeenCalled();
  });

  it("still edits a photo whose category was removed, as long as it keeps it", async () => {
    const { deps } = makeDeps();
    const retired = row({ tribe: "retired-category" });
    vi.spyOn(photoRepo, "findById").mockResolvedValue(retired);
    vi.spyOn(photoRepo, "update").mockResolvedValue({ ...retired, caption: "Fixed" });
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([]);
    const photo = await photoReviewService.update(
      deps,
      retired.id,
      { caption: "Fixed", tribe: "retired-category" },
      CATEGORY_IDS,
    );
    expect(photo.caption).toBe("Fixed");
  });

  it("stores the thumbnail next to the image and links it", async () => {
    const { deps } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
    vi.spyOn(photoRepo, "createIfUnder").mockImplementation(async (_db, values) =>
      row(values as PhotoRow),
    );

    const result = await photoUploadService.upload(deps, {
      image: jpeg(),
      thumb: jpeg(480, 360),
      caption: null,
      tribe: A_TRIBE,
      clientIp: "1.2.3.4",
      policy: POLICY,
    });

    const { id } = result.photo;
    expect(put).toHaveBeenCalledWith(deps.bucket, `thumbs/${id}`, expect.anything(), "image/jpeg");
    expect(result.photo.thumbUrl).toBe(`https://api.test/photos/${id}/thumb`);
  });

  it("checks the thumbnail like the image", async () => {
    const { deps } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put");
    const upload = (thumb: File) =>
      photoUploadService.upload(deps, {
        image: jpeg(),
        thumb,
        caption: null,
        tribe: A_TRIBE,
        clientIp: "1.2.3.4",
        policy: POLICY,
      });

    await expect(
      upload(new File(["<svg/>"], "t.jpg", { type: "image/jpeg" })),
    ).rejects.toMatchObject({ code: PHOTO_UNSUPPORTED_TYPE });
    await expect(upload(jpeg(4000, 3000))).rejects.toMatchObject({
      code: PHOTO_DIMENSIONS_TOO_LARGE,
    });
    await expect(
      upload(
        new File([new Uint8Array(PHOTO_LIMITS.thumbMaxBytes + 1)], "t.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({ code: PHOTO_TOO_LARGE });
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects uploads over the per-client burst limit without storing anything", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "countRecentByIpHash").mockResolvedValue(60);
    const put = vi.spyOn(photoStorageRepo, "put");

    await expect(
      photoUploadService.upload(deps, {
        image: jpeg(),
        caption: null,
        tribe: B_TRIBE,
        clientIp: "1.2.3.4",
        policy: POLICY,
      }),
    ).rejects.toMatchObject({ code: PHOTO_RATE_LIMITED, status: 429 });
    expect(put).not.toHaveBeenCalled();
  });

  it("refuses everyone once the global caps are hit, so cost stays bounded", async () => {
    const { deps } = makeDeps();
    underLimits();
    vi.spyOn(photoRepo, "countPending").mockResolvedValue(300);
    const put = vi.spyOn(photoStorageRepo, "put");

    await expect(
      photoUploadService.upload(deps, {
        image: jpeg(),
        caption: null,
        tribe: B_TRIBE,
        clientIp: "9.9.9.9",
        policy: POLICY,
      }),
    ).rejects.toMatchObject({ code: PHOTO_WALL_BUSY, status: 503 });
    expect(put).not.toHaveBeenCalled();
  });

  it("checks the real bytes, not the declared type", async () => {
    const { deps } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put");
    const disguised = new File(["<html><script>alert(1)</script>"], "x.jpg", {
      type: "image/jpeg",
    });

    await expect(
      photoUploadService.upload(deps, {
        image: disguised,
        caption: null,
        tribe: B_TRIBE,
        clientIp: "1.1.1.1",
        policy: POLICY,
      }),
    ).rejects.toMatchObject({ code: PHOTO_UNSUPPORTED_TYPE, status: 415 });
    expect(put).not.toHaveBeenCalled();

    // A tiny file that claims a 20000px frame would exhaust the TV's memory.
    await expect(
      photoUploadService.upload(deps, {
        image: jpeg(20000, 20000),
        caption: null,
        tribe: B_TRIBE,
        clientIp: "1.1.1.1",
        policy: POLICY,
      }),
    ).rejects.toMatchObject({ code: PHOTO_DIMENSIONS_TOO_LARGE, status: 413 });
    expect(put).not.toHaveBeenCalled();
  });
});

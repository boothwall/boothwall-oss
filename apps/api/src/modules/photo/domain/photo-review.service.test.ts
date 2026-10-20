import { DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import { PHOTO_DELETE_FORBIDDEN, PHOTO_NOT_FOUND } from "./photo.errors";
import { A_TRIBE, B_TRIBE, CATEGORY_IDS, makeDeps, now, row, wallView } from "./photo.fixtures";
import { photoReviewService } from "./photo-review.service";

afterEach(() => vi.restoreAllMocks());

describe("photoReviewService.approve", () => {
  it("approves a pending photo and broadcasts it to the wall", async () => {
    const { deps, broadcast } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "pending", approvedAt: null }));
    vi.spyOn(photoRepo, "approve").mockResolvedValue(row());
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

    const photo = await photoReviewService.approve(deps, row().id);

    expect(photo.status).toBe("approved");
    expect(broadcast).toHaveBeenCalledWith({
      type: "photo.created",
      photo,
      stats: { total: 1, byTribe: { [A_TRIBE]: 1 } },
    });
  });
});

describe("photoReviewService.remove", () => {
  it("requires the owner's delete token unless the caller is admin", async () => {
    const { deps, broadcast } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    vi.spyOn(photoRepo, "setRemoved").mockResolvedValue();
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([]);
    const del = vi.spyOn(photoStorageRepo, "delete").mockResolvedValue();
    const id = row().id;

    await expect(
      photoReviewService.remove(deps, { id, deleteToken: "wrong", isAdmin: false }),
    ).rejects.toMatchObject({ code: PHOTO_DELETE_FORBIDDEN, status: 403 });
    expect(del).not.toHaveBeenCalled();

    await photoReviewService.remove(deps, { id, isAdmin: true });
    expect(del).toHaveBeenCalledWith(deps.bucket, "photos/x");
    expect(del).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledWith({
      type: "photo.removed",
      photoId: id,
      stats: { total: 0, byTribe: {} },
    });
  });
});

describe("photoReviewService.purgeExpired", () => {
  it("deletes the thumbnail along with the image and the row", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findCreatedBefore").mockResolvedValue([row({ thumbKey: "thumbs/x" })]);
    const deleteRow = vi.spyOn(photoRepo, "deleteById").mockResolvedValue();
    const del = vi.spyOn(photoStorageRepo, "delete").mockResolvedValue();

    await expect(photoReviewService.purgeExpired(deps, { retentionDays: 7, now })).resolves.toBe(1);
    expect(del).toHaveBeenCalledWith(deps.bucket, "photos/x");
    expect(del).toHaveBeenCalledWith(deps.bucket, "thumbs/x");
    expect(deleteRow).toHaveBeenCalledWith(deps.db, row().id);
  });

  it("leaves photos marked keep alone", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findCreatedBefore").mockResolvedValue([row({ keep: true })]);
    const deleteRow = vi.spyOn(photoRepo, "deleteById").mockResolvedValue();
    const del = vi.spyOn(photoStorageRepo, "delete").mockResolvedValue();

    await expect(photoReviewService.purgeExpired(deps, { retentionDays: 7, now })).resolves.toBe(0);
    expect(del).not.toHaveBeenCalled();
    expect(deleteRow).not.toHaveBeenCalled();
  });
});

describe("photoReviewService.update", () => {
  const withStats = () =>
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

  it("hides a photo on the wall and takes it off every screen", async () => {
    const { deps, broadcast } = makeDeps();
    withStats();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    const update = vi
      .spyOn(photoRepo, "update")
      .mockImplementation(async (_db, _wallId, _id, values) => row(values));

    const photo = await photoReviewService.update(deps, row().id, { hidden: true }, CATEGORY_IDS);

    expect(update).toHaveBeenCalledWith(deps.db, DEFAULT_WALL_ID, row().id, { status: "hidden" });
    expect(photo.status).toBe("hidden");
    expect(photo.imageUrl).toContain("sig=");
    expect(broadcast).toHaveBeenCalledWith({
      type: "photo.removed",
      photoId: row().id,
      stats: { total: 1, byTribe: { [A_TRIBE]: 1 } },
    });
  });

  it("puts a hidden photo back as a new arrival, approving it if it never was", async () => {
    const { deps, broadcast } = makeDeps();
    withStats();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "hidden", approvedAt: null }));
    const update = vi
      .spyOn(photoRepo, "update")
      .mockImplementation(async (_db, _wallId, _id, values) => row(values));

    const photo = await photoReviewService.update(deps, row().id, { hidden: false }, CATEGORY_IDS);

    expect(update).toHaveBeenCalledWith(deps.db, DEFAULT_WALL_ID, row().id, {
      status: "approved",
      approvedAt: now,
    });
    expect(photo.imageUrl).not.toContain("sig=");
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "photo.created", photo: wallView(photo) }),
    );
  });

  it("sends caption and category edits on the wall as photo.updated", async () => {
    const { deps, broadcast } = makeDeps();
    withStats();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    vi.spyOn(photoRepo, "update").mockImplementation(async (_db, _wallId, _id, values) =>
      row(values),
    );

    const photo = await photoReviewService.update(
      deps,
      row().id,
      { caption: null, tribe: B_TRIBE },
      CATEGORY_IDS,
    );

    expect(photo).toMatchObject({ caption: null, tribe: B_TRIBE, status: "approved" });
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "photo.updated", photo: wallView(photo) }),
    );
  });

  it("keeps edits to photos off the wall, and no-op edits, off the socket", async () => {
    const { deps, broadcast } = makeDeps();
    const find = vi.spyOn(photoRepo, "findById");
    vi.spyOn(photoRepo, "update").mockImplementation(async (_db, _wallId, _id, values) =>
      row({ status: "pending", approvedAt: null, ...values }),
    );

    find.mockResolvedValue(row({ status: "pending", approvedAt: null }));
    await photoReviewService.update(
      deps,
      row().id,
      { caption: "Edited", hidden: false },
      CATEGORY_IDS,
    );
    find.mockResolvedValue(row({ status: "pending", approvedAt: null, caption: "Same" }));
    await photoReviewService.update(deps, row().id, { caption: "Same" }, CATEGORY_IDS);

    expect(broadcast).not.toHaveBeenCalled();
  });

  it("can't edit a deleted photo", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ removedAt: now }));
    await expect(
      photoReviewService.update(deps, row().id, { hidden: true }, CATEGORY_IDS),
    ).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });
  });
});

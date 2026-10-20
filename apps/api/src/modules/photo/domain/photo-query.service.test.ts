import { DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import { PHOTO_CURSOR_INVALID, PHOTO_NOT_FOUND } from "./photo.errors";
import { A_TRIBE, B_TRIBE, CATEGORY_IDS, makeDeps, now, row } from "./photo.fixtures";
import { photoQueryService } from "./photo-query.service";
import { photoReviewService } from "./photo-review.service";

afterEach(() => vi.restoreAllMocks());

describe("photoQueryService.getImage", () => {
  it("serves a pending image only through the Control panel's signed link", async () => {
    const { deps } = makeDeps();
    const pending = row({ status: "pending", approvedAt: null });
    vi.spyOn(photoRepo, "findById").mockResolvedValue(pending);
    vi.spyOn(photoRepo, "findByStatus").mockResolvedValue([pending]);
    vi.spyOn(photoStorageRepo, "get").mockResolvedValue({} as R2ObjectBody);

    await expect(photoQueryService.getImage(deps, pending.id, undefined)).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });
    await expect(
      photoQueryService.getImage(deps, pending.id, "0".repeat(32)),
    ).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });

    const [listed] = await photoQueryService.getPending(deps, 10);
    const sig = new URL(listed?.imageUrl ?? "").searchParams.get("sig") ?? undefined;
    await expect(photoQueryService.getImage(deps, pending.id, sig)).resolves.toMatchObject({
      approved: false,
    });
  });

  it("serves the thumbnail, or the full image when the photo has none", async () => {
    const { deps } = makeDeps();
    const thumb = { httpMetadata: { contentType: "image/jpeg" } } as R2ObjectBody;
    const full = {} as R2ObjectBody;
    const get = vi
      .spyOn(photoStorageRepo, "get")
      .mockImplementation(async (_bucket, key) => (key.startsWith("thumbs/") ? thumb : full));
    const find = vi.spyOn(photoRepo, "findById");

    find.mockResolvedValue(row({ thumbKey: "thumbs/x" }));
    await expect(
      photoQueryService.getImage(deps, row().id, undefined, "thumb"),
    ).resolves.toMatchObject({
      object: thumb,
    });

    find.mockResolvedValue(row());
    await expect(
      photoQueryService.getImage(deps, row().id, undefined, "thumb"),
    ).resolves.toMatchObject({
      object: full,
    });
    expect(get).toHaveBeenLastCalledWith(deps.bucket, "photos/x");
  });
});

describe("the wall's view of a checked photo", () => {
  it("carries the highlight score and nothing else from the verdict", async () => {
    const { deps, broadcast } = makeDeps();
    const analysis = { verdict: "safe", flags: [], highlight: 0.82 } as never;
    deps.analyses = { forPhotos: vi.fn().mockResolvedValue(new Map([[row().id, analysis]])) };
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "pending", approvedAt: null }));
    vi.spyOn(photoRepo, "approve").mockResolvedValue(row());
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([]);

    const photo = await photoReviewService.approve(deps, row().id);

    expect(photo).toMatchObject({ highlight: 0.82 });
    expect(photo).not.toHaveProperty("analysis");
    expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ photo }));
  });
});

const ID_2 = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d002";
const ID_3 = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d003";

describe("photoQueryService.list", () => {
  it("pages by cursor and signs the images that aren't on the wall", async () => {
    const { deps } = makeDeps();
    const rows = [
      { ...row(), rank: 0 },
      { ...row({ id: ID_2, status: "hidden" }), rank: 0 },
      { ...row({ id: ID_3, status: "pending", approvedAt: null }), rank: 0 },
    ];
    const list = vi.spyOn(photoRepo, "list").mockResolvedValue(rows);

    const page = await photoQueryService.list(deps, {
      sort: "newest",
      limit: 2,
      categoryOrder: CATEGORY_IDS,
    });

    expect(list).toHaveBeenCalledWith(deps.db, DEFAULT_WALL_ID, {
      sort: "newest",
      limit: 3,
      cursor: undefined,
      categoryOrder: CATEGORY_IDS,
    });
    expect(page.photos.map((photo) => photo.id)).toEqual([row().id, ID_2]);
    expect(page.photos[0]?.imageUrl).not.toContain("sig=");
    expect(page.photos[1]?.imageUrl).toMatch(/\?sig=[0-9a-f]{32}$/);
    expect(page.nextCursor).toEqual(expect.any(String));

    list.mockResolvedValue(rows.slice(2));
    const next = await photoQueryService.list(deps, {
      categoryOrder: CATEGORY_IDS,
      sort: "newest",
      limit: 2,
      cursor: page.nextCursor ?? "",
    });
    expect(list).toHaveBeenLastCalledWith(deps.db, DEFAULT_WALL_ID, {
      sort: "newest",
      limit: 3,
      cursor: { rank: 0, createdAt: now.getTime(), id: ID_2 },
      categoryOrder: CATEGORY_IDS,
    });
    expect(next.nextCursor).toBeNull();
    expect(next.photos[0]?.imageUrl).toContain("sig=");
  });

  it("refuses a cursor from another sort or a made-up one", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "list").mockResolvedValue([
      { ...row(), rank: 0 },
      { ...row({ id: ID_2 }), rank: 0 },
    ]);
    const { nextCursor } = await photoQueryService.list(deps, {
      sort: "newest",
      limit: 1,
      categoryOrder: CATEGORY_IDS,
    });

    for (const cursor of [nextCursor ?? "", "not-a-cursor", btoa("[1,2,3]")]) {
      await expect(
        photoQueryService.list(deps, {
          categoryOrder: CATEGORY_IDS,
          sort: cursor === nextCursor ? "oldest" : "newest",
          limit: 1,
          cursor,
        }),
      ).rejects.toMatchObject({ code: PHOTO_CURSOR_INVALID, status: 400 });
    }
  });
});

describe("photoQueryService.stats", () => {
  it("counts photos per status and category, and uploads since the booth's midnight", async () => {
    const { deps } = makeDeps();
    const midnight = new Date("2026-10-07T00:00:00.000Z");
    vi.spyOn(photoRepo, "countByStatusAndTribe").mockResolvedValue([
      { status: "approved", tribe: A_TRIBE, value: 3 },
      { status: "pending", tribe: A_TRIBE, value: 1 },
      { status: "hidden", tribe: B_TRIBE, value: 2 },
      { status: "approved", tribe: "retired-category", value: 4 },
    ]);
    const since = vi.spyOn(photoRepo, "countCreatedSince").mockResolvedValue(9);

    const stats = await photoQueryService.stats(deps, midnight);

    expect(since).toHaveBeenCalledWith(deps.db, DEFAULT_WALL_ID, midnight);
    expect(stats).toEqual({
      onWall: 7,
      pending: 1,
      hidden: 2,
      uploadsToday: 9,
      byTribe: {
        [A_TRIBE]: { onWall: 3, pending: 1, hidden: 0 },
        [B_TRIBE]: { onWall: 0, pending: 0, hidden: 2 },
        // A category removed from the live list still counts, under its id.
        "retired-category": { onWall: 4, pending: 0, hidden: 0 },
      },
    });
  });
});

describe("photoQueryService.getImage for hidden photos", () => {
  it("keeps a hidden image private, like a pending one", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "hidden" }));
    vi.spyOn(photoStorageRepo, "get").mockResolvedValue({} as R2ObjectBody);
    await expect(photoQueryService.getImage(deps, row().id, undefined)).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });
  });
});

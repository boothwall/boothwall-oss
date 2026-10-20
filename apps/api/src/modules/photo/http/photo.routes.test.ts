import { type ControlPhotoDTO } from "@boothwall/shared";
import { describe, expect, it, vi } from "vitest";

import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";

import { ID, mockRouteDefaults, request, TRIBE } from "./photo.routes.fixtures";

mockRouteDefaults();

// A standalone server without an analysis collaborator returns no annotations.
describe("standalone photo views", () => {
  const stored = (status: PhotoRow["status"]): PhotoRow => ({
    id: ID,
    wallId: "default",
    caption: null,
    tribe: TRIBE,
    status,
    objectKey: `photos/${ID}`,
    contentType: "image/jpeg",
    thumbKey: `thumbs/${ID}`,
    ipHash: "hash",
    deleteTokenHash: "hash",
    createdAt: new Date("2026-10-11T12:00:00.000Z"),
    approvedAt: null,
    removedAt: null,
    keep: false,
    reactions: "{}",
  });

  it("keeps basic control and guest views usable without annotations", async () => {
    const findByStatus = vi.spyOn(photoRepo, "findByStatus");
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([]);

    findByStatus.mockResolvedValue([stored("pending")]);
    const queue = (await (await request("/photos/pending")).json()) as {
      photos: ControlPhotoDTO[];
    };
    expect(queue.photos[0]?.analysis).toBeNull();

    findByStatus.mockResolvedValue([stored("approved")]);
    const wall = await (await request("/photos", { passcode: "" })).text();
    expect(wall).toContain(ID);
    expect(wall).not.toContain("analysis");
    expect(wall).not.toContain("offensive");

    const status = await request("/moderation/status");
    expect(status.status).toBe(404);
  });
});

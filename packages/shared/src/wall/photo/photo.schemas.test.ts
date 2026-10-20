import { describe, expect, it } from "vitest";

import { wallEventSchema } from "../events/wall-events.schemas.ts";
import {
  captionSchema,
  guestPhotoStatusSchema,
  PHOTO_LIMITS,
  photoSchema,
} from "./photo.schemas.ts";

describe("wall contracts", () => {
  it("normalises captions and enforces the length limit", () => {
    expect(captionSchema.parse("  hi  ")).toBe("hi");
    expect(captionSchema.parse("   ")).toBeNull();
    expect(captionSchema.safeParse("x".repeat(PHOTO_LIMITS.captionMaxLength + 1)).success).toBe(
      false,
    );
  });

  it("tells a guest one of three states about their photo, and nothing more", () => {
    for (const state of ["waiting", "live", "declined"])
      expect(guestPhotoStatusSchema.parse({ state, status: "hidden" })).toEqual({ state });
    expect(guestPhotoStatusSchema.safeParse({ state: "hidden" }).success).toBe(false);
    expect(guestPhotoStatusSchema.safeParse({}).success).toBe(false);
  });

  it("requires a thumbnail URL on every photo", () => {
    const photo = {
      id: "p1",
      status: "approved",
      caption: null,
      tribe: "fire-tv",
      imageUrl: "/photos/p1/image",
      createdAt: "2026-10-07T12:00:00.000Z",
    };
    expect(photoSchema.safeParse(photo).success).toBe(false);
    expect(photoSchema.safeParse({ ...photo, thumbUrl: "/photos/p1/thumb" }).success).toBe(true);
    expect(PHOTO_LIMITS.thumbEdgePx).toBeLessThan(PHOTO_LIMITS.maxEdgePx);
  });

  it("rejects wall events with a malformed category id", () => {
    const event = {
      type: "photo.created",
      stats: { total: 1, byTribe: {} },
      photo: {
        id: "p1",
        status: "approved",
        caption: null,
        tribe: "Not A Slug!",
        imageUrl: "/photos/p1/image",
        thumbUrl: "/photos/p1/thumb",
        createdAt: "2026-10-07T12:00:00.000Z",
      },
    };
    expect(wallEventSchema.safeParse(event).success).toBe(false);
  });
});

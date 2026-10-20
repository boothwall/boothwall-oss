import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "#config";
import { DEFAULT_SMART_MODERATION } from "#settings";
import { wallSettingsSchema } from "#settings";
import { wallEventSchema } from "#wall";

import {
  controlPhotoSchema,
  PHOTO_PAGE_MAX,
  photoListQuerySchema,
  photoPatchSchema,
} from "./photo-control.schemas.ts";

const tribe = "fire-tv";

describe("control contracts", () => {
  it("defaults the list query and caps the page size", () => {
    expect(photoListQuerySchema.parse({})).toEqual({ sort: "newest", limit: 24 });
    expect(photoListQuerySchema.parse({ q: "  ", limit: "10" })).toEqual({
      sort: "newest",
      limit: 10,
    });
    expect(photoListQuerySchema.safeParse({ limit: PHOTO_PAGE_MAX + 1 }).success).toBe(false);
    expect(photoListQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("accepts a partial edit, clears an empty caption and refuses an empty one", () => {
    expect(photoPatchSchema.parse({ caption: "  " })).toEqual({ caption: null });
    expect(photoPatchSchema.parse({ tribe, hidden: true })).toEqual({ tribe, hidden: true });
    expect(photoPatchSchema.safeParse({}).success).toBe(false);
    expect(photoPatchSchema.safeParse({ status: "approved" }).success).toBe(false);
    expect(photoPatchSchema.safeParse({ tribe: "Not valid!" }).success).toBe(false);
  });

  it("carries edits to the wall as photo.updated", () => {
    const event = {
      type: "photo.updated",
      stats: { total: 1, byTribe: { [tribe]: 1 } },
      photo: {
        id: "p1",
        status: "approved",
        caption: "New caption",
        tribe,
        imageUrl: "/photos/p1/image",
        thumbUrl: "/photos/p1/thumb",
        createdAt: "2026-10-07T12:00:00.000Z",
      },
    };
    expect(wallEventSchema.safeParse(event).success).toBe(true);
  });

  it("reads photos and settings from before smart moderation existed", () => {
    const photo = {
      id: "p1",
      status: "pending",
      caption: null,
      tribe,
      imageUrl: "https://api.test/photos/p1/image",
      thumbUrl: "https://api.test/photos/p1/thumb",
      createdAt: "2026-10-11T12:00:00.000Z",
    };
    expect(controlPhotoSchema.parse(photo).analysis).toBeNull();

    const older: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    delete older.smartModeration;
    const settings = wallSettingsSchema.parse(older);
    expect(settings.smartModeration).toEqual(DEFAULT_SMART_MODERATION);
  });
});

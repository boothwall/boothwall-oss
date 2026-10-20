import { DEFAULT_SETTINGS, type WallSnapshotDTO } from "@boothwall/shared";

import { parseWallCache, serializeWallCache, wallCacheKey } from "./wallCache";

const snapshot: WallSnapshotDTO = {
  photos: [
    {
      id: "p1",
      status: "approved",
      caption: "Hello",
      tribe: "fire-tv",
      imageUrl: "https://api.test/photos/p1/image",
      thumbUrl: "https://api.test/photos/p1/thumb",
      createdAt: "2026-10-11T12:00:00.000Z",
    },
  ],
  stats: { total: 1, byTribe: { "fire-tv": 1 } },
  settings: DEFAULT_SETTINGS,
};

describe("wallCache", () => {
  it("round-trips the last snapshot with when it was saved", () => {
    expect(parseWallCache(serializeWallCache(snapshot, 42))).toEqual({ snapshot, savedAt: 42 });
  });

  it("ignores nothing stored, broken JSON, other versions and drifted shapes", () => {
    expect(parseWallCache(null)).toBeUndefined();
    expect(parseWallCache("{not json")).toBeUndefined();
    const stored = JSON.parse(serializeWallCache(snapshot, 42));
    expect(parseWallCache(JSON.stringify({ ...stored, version: 0 }))).toBeUndefined();
    expect(
      parseWallCache(JSON.stringify({ ...stored, snapshot: { photos: "x" } })),
    ).toBeUndefined();
  });

  it("keeps one entry per wall", () => {
    expect(wallCacheKey("default")).not.toBe(wallCacheKey("spring-fair"));
  });
});

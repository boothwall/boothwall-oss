import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";

import { POOL_LIMIT } from "../constants/feed";
import { nextPage, pageCount, pageOf } from "./wallPages";
import { initialWallState, SLOT_COUNT, wallReducer } from "./wallState";

const photo = (n: number): PhotoDTO => ({
  id: `p${n}`,
  status: "approved",
  caption: null,
  tribe: "fire-tv",
  imageUrl: `https://api.test/photos/p${n}/image`,
  thumbUrl: `https://api.test/photos/p${n}/thumb`,
  createdAt: new Date(Date.UTC(2026, 9, 7, 12, 0, n)).toISOString(),
});

const stats = { total: 0, byTribe: {} };

describe("wallReducer", () => {
  it("puts a live photo into the slot of the oldest one when the wall is full", () => {
    const photos = Array.from({ length: SLOT_COUNT }, (_, i) => photo(SLOT_COUNT - i)); // newest first
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    const oldestSlot = state.slots.indexOf("p1");

    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.created", photo: photo(99), stats },
    });

    expect(state.slots[oldestSlot]).toBe("p99");
    expect(state.fresh).toEqual(["p99"]);
  });

  it("refills a removed photo's slot from photos waiting off-screen", () => {
    const photos = Array.from({ length: SLOT_COUNT + 1 }, (_, i) => photo(SLOT_COUNT + 1 - i));
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    const waiting = photos.find((p) => !state.slots.includes(p.id))?.id;
    const slot = state.slots.indexOf("p5");

    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.removed", photoId: "p5", stats },
    });

    expect(state.slots[slot]).toBe(waiting);
    expect(state.pool.some((p) => p.id === "p5")).toBe(false);
  });

  it("applies an edit in place, without moving the photo or marking it new", () => {
    const photos = Array.from({ length: SLOT_COUNT }, (_, i) => photo(SLOT_COUNT - i));
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    const slots = state.slots;
    const tribe = "visiting";
    const edited = { ...photo(3), caption: "Fixed typo", tribe };
    const nextStats = { total: SLOT_COUNT, byTribe: { [tribe]: 1 } };

    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.updated", photo: edited, stats: nextStats },
    });

    expect(state.slots).toEqual(slots);
    expect(state.pool.find((p) => p.id === "p3")).toEqual(edited);
    expect(state.pool.map((p) => p.id)).toEqual(photos.map((p) => p.id));
    expect(state.fresh).toEqual([]);
    expect(state.stats).toBe(nextStats);
  });

  it("ignores an edit to a photo it doesn't hold, apart from the stats", () => {
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos: [photo(1)], stats, settings: DEFAULT_SETTINGS },
    });
    const nextStats = { total: 1, byTribe: {} };
    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.updated", photo: photo(42), stats: nextStats },
    });
    expect(state.pool.map((p) => p.id)).toEqual(["p1"]);
    expect(state.stats).toBe(nextStats);
  });

  it("turns pages at multiples of the slot count; the last one may be part empty", () => {
    const photos = Array.from({ length: SLOT_COUNT + 3 }, (_, i) => photo(SLOT_COUNT + 3 - i));
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    expect([pageOf(state), pageCount(state)]).toEqual([0, 2]);

    const second = nextPage(state, 1);
    expect(second.slice(0, 3)).toEqual(photos.slice(SLOT_COUNT).map((p) => p.id));
    expect(second.slice(3).every((id) => id === null)).toBe(true);
    state = wallReducer(state, { type: "page", slots: second });
    expect([state.turn, pageOf(state)]).toEqual([1, 1]);
    // Both directions wrap round to the first page.
    expect(nextPage(state, 1)).toEqual(photos.slice(0, SLOT_COUNT).map((p) => p.id));
    expect(nextPage(state, -1)).toEqual(photos.slice(0, SLOT_COUNT).map((p) => p.id));
  });

  it("keeps the page number when a live arrival lands in one slot", () => {
    const photos = Array.from({ length: SLOT_COUNT * 2 }, (_, i) => photo(SLOT_COUNT * 2 - i));
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    state = wallReducer(state, { type: "page", slots: nextPage(state, 1) });
    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.created", photo: photo(99), stats },
    });
    expect(pageOf(state)).toBe(1);
  });

  it("takes live settings from the snapshot and from settings events", () => {
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos: [], stats, settings: { ...DEFAULT_SETTINGS, secondsPerPhoto: 12 } },
    });
    expect(state.settings.secondsPerPhoto).toBe(12);
    state = wallReducer(state, {
      type: "settings",
      settings: { ...DEFAULT_SETTINGS, announcement: "Keynote at 14:00" },
    });
    expect(state.settings.announcement).toBe("Keynote at 14:00");
  });

  it("has no other page when every photo fits on screen", () => {
    const photos = Array.from({ length: 4 }, (_, i) => photo(4 - i));
    const state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    expect(nextPage(state, 1)).toBe(state.slots);
  });

  it("never lands an arrival on a pinned photo", () => {
    const photos = Array.from({ length: SLOT_COUNT }, (_, i) => photo(SLOT_COUNT - i));
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    state = wallReducer(state, { type: "pin", ids: ["p1"] });
    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.created", photo: photo(99), stats },
    });

    expect(state.slots).toContain("p1");
    expect(state.slots).toContain("p99");
  });

  it("drops photos that fell out of the pool and stale fresh ids", () => {
    const photos = Array.from({ length: POOL_LIMIT }, (_, i) => photo(POOL_LIMIT - i));
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
    });
    // The oldest photo in the pool is on screen when the pool overflows.
    state = wallReducer(state, { type: "page", slots: [...state.slots.slice(1), "p1"] });
    // A burst fills every slot with arrivals that never settle.
    for (let n = 1; n <= SLOT_COUNT + 3; n++) {
      state = wallReducer(state, {
        type: "event",
        event: { type: "photo.created", photo: photo(1000 + n), stats },
      });
    }

    const pool = new Set(state.pool.map((p) => p.id));
    expect(state.pool).toHaveLength(POOL_LIMIT);
    expect(state.slots.every((id) => id !== null && pool.has(id))).toBe(true);
    expect(state.fresh.length).toBeLessThanOrEqual(SLOT_COUNT);
    expect(state.fresh.every((id) => state.slots.includes(id))).toBe(true);
  });

  it("keeps a photo's latest reaction totals and ignores photos no longer on the wall", () => {
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos: [photo(1)], stats, settings: DEFAULT_SETTINGS },
    });
    const counts = { heart: 3, fire: 1, laugh: 0, clap: 0 };

    state = wallReducer(state, { type: "reactions", photoId: "p1", counts });
    expect(state.pool[0]?.reactions).toEqual(counts);
    expect(wallReducer(state, { type: "reactions", photoId: "gone", counts })).toBe(state);
  });
});

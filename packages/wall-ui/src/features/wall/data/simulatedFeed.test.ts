import type { PhotoDTO } from "@boothwall/shared";

import { DEMO_PHOTO_COUNT, demoPhotos } from "./demoPhotos";
import { simulatedSnapshot, startSimulatedEvents } from "./simulatedFeed";

// Jest stubs every bundled image to one URI; key each by its file instead.
jest.mock("#platform/assets", () => ({
  imageUri: (image: unknown) => JSON.stringify(image),
}));

describe("simulatedFeed", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("has a distinct image for every demo photo", () => {
    expect(new Set(demoPhotos().map((demo) => demo.full)).size).toBe(DEMO_PHOTO_COUNT);
  });

  it("never repeats a photo within one pool's worth, live arrivals included", () => {
    const { photos } = simulatedSnapshot(DEMO_PHOTO_COUNT);
    expect(new Set(photos.map((photo) => photo.imageUrl)).size).toBe(DEMO_PHOTO_COUNT);

    // The wall keeps the newest DEMO_PHOTO_COUNT (POOL_LIMIT in demo), so any page is a slice of them.
    let pool: PhotoDTO[] = photos;
    const stop = startSimulatedEvents(photos, 1_000, (event) => {
      if (event.type !== "photo.created") throw new Error(`unexpected ${event.type}`);
      pool = [event.photo, ...pool].slice(0, DEMO_PHOTO_COUNT);
      expect(new Set(pool.map((photo) => photo.imageUrl)).size).toBe(DEMO_PHOTO_COUNT);
    });
    jest.advanceTimersByTime(1_000 * DEMO_PHOTO_COUNT * 2);
    stop();
  });
});

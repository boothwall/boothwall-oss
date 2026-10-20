import type { PhotoDTO } from "@boothwall/shared";

import { drawOrder } from "./drawOrder";

const photo = (id: string, minute: number) =>
  ({ id, createdAt: `2026-10-11T10:${String(minute).padStart(2, "0")}:00.000Z` }) as PhotoDTO;

describe("drawOrder", () => {
  it("draws upper rows above lower ones, and the newest photo on top within a row", () => {
    const photos = new Map(
      [photo("old", 1), photo("new", 9), photo("low", 5)].map((p) => [p.id, p]),
    );
    const positions = [
      { x: 0, y: 0, rotate: 0, width: 100, layer: 2 },
      { x: 90, y: 0, rotate: 0, width: 100, layer: 2 },
      { x: 0, y: 120, rotate: 0, width: 100, layer: 1 },
    ];
    const [old, fresh, low] = drawOrder(["old", "new", "low"], positions, photos);
    expect(fresh).toBeGreaterThan(old!);
    expect(old).toBeGreaterThan(low!);
  });
});

import type { PhotoDTO, WallEvent } from "@boothwall/shared";
import { describe, expect, it } from "vitest";

import { isArrivalOf, showsPhoto } from "./approval";

const photo = { id: "p1" } as PhotoDTO;
const stats = { total: 1, byTribe: {} };

describe("approval", () => {
  it("spots the guest's own photo arriving, and nothing else", () => {
    const arrived: WallEvent = { type: "photo.created", photo, stats };
    const updated: WallEvent = { type: "photo.updated", photo, stats };
    expect(isArrivalOf(arrived, "p1")).toBe(true);
    expect(isArrivalOf(arrived, "p2")).toBe(false);
    expect(isArrivalOf(updated, "p1")).toBe(false);
    expect(isArrivalOf(undefined, "p1")).toBe(false);
    expect(showsPhoto({ photos: [photo] }, "p1")).toBe(true);
    expect(showsPhoto({ photos: [] }, "p1")).toBe(false);
  });
});

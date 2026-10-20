import { describe, expect, it } from "vitest";

import { ReactionBatch } from "./reaction-batch";

const counts = (heart: number, fire = 0) => ({ heart, fire, laugh: 0, clap: 0 });

describe("ReactionBatch", () => {
  it("asks for one flush per batch and sends each photo once with its latest totals", () => {
    const batch = new ReactionBatch();
    expect(batch.add("a", counts(1))).toBe(true);
    expect(batch.add("a", counts(2))).toBe(false);
    expect(batch.add("b", counts(1))).toBe(false);
    expect(batch.add("a", counts(3, 1))).toBe(false);

    expect(batch.drain()).toEqual([
      { photoId: "a", counts: counts(3, 1) },
      { photoId: "b", counts: counts(1) },
    ]);
    expect(batch.drain()).toEqual([]);
    expect(batch.add("a", counts(4, 1))).toBe(true);
  });

  it("never goes back to a lower total when taps arrive out of order", () => {
    const batch = new ReactionBatch();
    batch.add("a", counts(5));
    batch.add("a", counts(4, 2));
    expect(batch.drain()).toEqual([{ photoId: "a", counts: counts(5, 2) }]);
    batch.add("a", counts(3));
    expect(batch.drain()).toEqual([{ photoId: "a", counts: counts(5, 2) }]);
  });
});

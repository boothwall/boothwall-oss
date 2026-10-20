import { admitFloats, reactionIncreases } from "./reactionFloats";

describe("reaction floats", () => {
  it("floats one emoji per new tap, a few per reaction at most, nothing for a reset", () => {
    expect(reactionIncreases({ heart: 1, fire: 0 }, { heart: 2, fire: 0 })).toEqual(["heart"]);
    expect(reactionIncreases(undefined, { fire: 1, clap: 2 })).toEqual(["fire", "clap", "clap"]);
    expect(reactionIncreases({ laugh: 0 }, { laugh: 50 })).toEqual(["laugh", "laugh", "laugh"]);
    expect(reactionIncreases({ heart: 9 }, { heart: 0 })).toEqual([]);
  });

  it("drops what doesn't fit under the on-screen limit", () => {
    expect(admitFloats([1, 2, 3, 4], [5, 6, 7], 6)).toEqual([1, 2, 3, 4, 5, 6]);
    const full = [1, 2, 3, 4, 5, 6];
    expect(admitFloats(full, [7], 6)).toBe(full);
  });
});

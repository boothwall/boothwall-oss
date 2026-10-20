import type { PhotoDTO } from "@boothwall/shared";

import { FLOAT_RISE_DP } from "#features/reactions";

import { SPOTLIGHT } from "../constants/layout";
import { STAGE } from "../constants/layout";
import { SLOT_POSITIONS } from "./collageLayout";
import { reactionTargets } from "./reactionTargets";

const photo = (id: string): PhotoDTO => ({
  id,
  status: "approved",
  caption: null,
  tribe: "fire-tv",
  imageUrl: `https://api.test/photos/${id}/image`,
  thumbUrl: `https://api.test/photos/${id}/thumb`,
  createdAt: "2026-10-11T12:00:00.000Z",
  reactions: { heart: 1, fire: 0, laugh: 0, clap: 0 },
});

describe("reactionTargets", () => {
  const pool = [photo("a"), photo("b")];

  it("targets every filled slot at its card, skipping empty slots and unknown ids", () => {
    const slots = ["a", null, "gone", "b"];
    const positions = SLOT_POSITIONS;
    const targets = reactionTargets(pool, slots, positions, null);
    expect(targets.map((target) => target.photoId)).toEqual(["a", "b"]);
    const { x, y, width } = positions[3]!;
    // Floats start no higher than one rise below the stage's top, so they never reach the header.
    expect(targets[1]).toMatchObject({ x, y: Math.max(y, STAGE.top + FLOAT_RISE_DP), width });
    expect(targets[0]?.reactions?.heart).toBe(1);
  });

  it("targets only the open photo while the spotlight is up", () => {
    const targets = reactionTargets(pool, ["a", "b"], SLOT_POSITIONS, pool[1] ?? null);
    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      photoId: "b",
      x: SPOTLIGHT.cardLeft,
      width: SPOTLIGHT.cardWidth,
    });
  });
});

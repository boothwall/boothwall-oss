import { DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Db } from "@/db/client";
import { reactionRepo } from "@/modules/reaction/data/reaction.repo";

import { REACTION_PHOTO_NOT_FOUND, REACTION_RATE_LIMITED } from "./reaction.errors";
import { REACTION_LIMITS, reactionService } from "./reaction.service";
import type { ReactionDeps } from "./reaction.types";

const PHOTO_ID = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d001";
const TAP = { photoId: PHOTO_ID, reaction: "heart", clientIp: "203.0.113.7" } as const;

const makeDeps = (allowed = true) => {
  const room = {
    allow: vi.fn().mockResolvedValue(allowed),
    queue: vi.fn().mockResolvedValue(undefined),
  };
  const deps: ReactionDeps = {
    db: {} as Db,
    fingerprintKey: "fixture-only-client-fingerprint-key-32",
    wallId: DEFAULT_WALL_ID,
    room,
    now: () => new Date("2026-10-11T12:00:00.000Z"),
  };
  return { deps, room };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reactionService.react", () => {
  it("counts the tap on this wall and queues the new totals for the wall", async () => {
    const { deps, room } = makeDeps();
    const increment = vi.spyOn(reactionRepo, "increment").mockResolvedValue('{"heart":2,"fire":1}');

    const result = await reactionService.react(deps, TAP);

    const counts = { heart: 2, fire: 1, laugh: 0, clap: 0 };
    expect(result).toEqual({ photoId: PHOTO_ID, counts });
    expect(increment).toHaveBeenCalledWith(deps.db, DEFAULT_WALL_ID, PHOTO_ID, "heart");
    expect(room.allow).toHaveBeenCalledWith(
      {
        current: expect.stringMatching(/^hmac-v1:[0-9a-f]{64}$/),
        legacy: expect.stringMatching(/^[0-9a-f]{64}$/),
      },
      REACTION_LIMITS,
    );
    expect(room.queue).toHaveBeenCalledWith(PHOTO_ID, counts);
  });

  it("refuses a client over the limit before touching the database", async () => {
    const { deps, room } = makeDeps(false);
    const increment = vi.spyOn(reactionRepo, "increment");

    await expect(reactionService.react(deps, TAP)).rejects.toMatchObject({
      status: 429,
      code: REACTION_RATE_LIMITED,
    });
    expect(increment).not.toHaveBeenCalled();
    expect(room.queue).not.toHaveBeenCalled();
  });

  it("only counts approved photos", async () => {
    const { deps, room } = makeDeps();
    vi.spyOn(reactionRepo, "increment").mockResolvedValue(null);

    await expect(reactionService.react(deps, TAP)).rejects.toMatchObject({
      status: 404,
      code: REACTION_PHOTO_NOT_FOUND,
    });
    expect(room.queue).not.toHaveBeenCalled();
  });

  it("keeps the tap when the push to the wall fails", async () => {
    const { deps, room } = makeDeps();
    vi.spyOn(reactionRepo, "increment").mockResolvedValue('{"heart":1}');
    room.queue.mockRejectedValue(new Error("room down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(reactionService.react(deps, TAP)).resolves.toMatchObject({ photoId: PHOTO_ID });
  });
});

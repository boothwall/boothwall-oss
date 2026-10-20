import { DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { reactionService } from "@/modules/reaction/domain/reaction.service";

const ID = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d001";
const env = {
  DB: {},
  PHOTOS: {},
  WALL: { idFromName: () => "id", get: () => ({}) },
  ADMIN_TOKEN: "test-passcode",
  CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
  ALLOWED_ORIGINS: "https://booth.test",
  RETENTION_DAYS: "30",
} as unknown as AppBindings;

const react = (body: unknown, id = ID) =>
  app.request(
    `/photos/${id}/reactions`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.7" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
    env,
  );

const errorCode = async (res: Response) =>
  ((await res.json()) as { error: { code: string } }).error.code;

const counts = { heart: 1, fire: 0, laugh: 0, clap: 0 };

beforeEach(() => {
  vi.spyOn(reactionService, "react").mockResolvedValue({ photoId: ID, counts });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /photos/:id/reactions", () => {
  it("counts a tap without a passcode", async () => {
    const res = await react({ reaction: "heart" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ photoId: ID, counts });
    const [deps, args] = vi.mocked(reactionService.react).mock.calls[0] ?? [];
    expect(deps?.wallId).toBe(DEFAULT_WALL_ID);
    expect(args).toEqual({ photoId: ID, reaction: "heart", clientIp: "203.0.113.7" });
  });

  it("rejects reactions outside the list", async () => {
    const res = await react({ reaction: "poop" });
    expect(res.status).toBe(400);
    expect(await errorCode(res)).toBe("VALIDATION_FAILED");
    expect(reactionService.react).not.toHaveBeenCalled();
  });

  it("answers a body that isn't JSON with a 400, not a 500", async () => {
    const res = await react("{not json");
    expect(res.status).toBe(400);
    expect(await errorCode(res)).toBe("REQUEST_MALFORMED");
    expect(reactionService.react).not.toHaveBeenCalled();
  });

  it("rejects a malformed photo id and oversized bodies", async () => {
    expect((await react({ reaction: "heart" }, "nope")).status).toBe(400);
    const big = await react(JSON.stringify({ reaction: "heart", pad: "x".repeat(512) }));
    expect(big.status).toBe(400);
    expect(await errorCode(big)).toBe("REACTION_BODY_TOO_LARGE");
    expect(reactionService.react).not.toHaveBeenCalled();
  });
});

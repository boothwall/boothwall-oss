import { DEFAULT_SETTINGS, DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app, createApp } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { photoService } from "@/modules/photo";
import { settingsRepo } from "@/modules/settings/data/settings.repo";

const env = {
  DB: {},
  PHOTOS: {},
  WALL: {},
  ADMIN_TOKEN: "test-passcode",
  CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
  ALLOWED_ORIGINS: "https://booth.test",
  RETENTION_DAYS: "30",
} as unknown as AppBindings;

const getWall = () => vi.mocked(photoService.getWall);

beforeEach(() => {
  vi.spyOn(settingsRepo, "get").mockResolvedValue(null);
  vi.spyOn(photoService, "getWall").mockResolvedValue({
    photos: [],
    stats: { total: 0, byTribe: {} },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("wall context", () => {
  it("serves the default wall when nothing else is configured", async () => {
    const res = await app.request("/photos", {}, env);

    expect(res.status).toBe(200);
    expect(getWall().mock.calls[0]?.[0].wallId).toBe(DEFAULT_WALL_ID);
    expect(settingsRepo.get).toHaveBeenCalledWith(expect.anything(), "wall");
    const body = (await res.json()) as { settings: unknown };
    expect(body.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("lets a host pick the wall per request", async () => {
    const embedded = createApp({ resolveWall: (c) => c.req.header("x-wall") ?? DEFAULT_WALL_ID });

    await embedded.request("/photos", { headers: { "x-wall": "second" } }, env);

    expect(getWall().mock.calls[0]?.[0].wallId).toBe("second");
    expect(settingsRepo.get).toHaveBeenCalledWith(expect.anything(), "wall:second");
  });

  it("refuses a wall id that isn't safe to use as a key", async () => {
    const embedded = createApp({ resolveWall: () => "../Main" });
    const res = await embedded.request("/photos", {}, env);
    expect(res.status).toBe(400);
  });
});

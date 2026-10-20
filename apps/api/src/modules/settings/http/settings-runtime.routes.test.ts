import { DEFAULT_SETTINGS, type WallSettings } from "@boothwall/shared";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { createApp } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { adminGuardService } from "@/modules/auth";
import { settingsRepo } from "@/modules/settings/data/settings.repo";
import { wallService } from "@/modules/wall";

const app = createApp({ settingsAuthority: "stored" });
const env = {
  DB: {},
  PHOTOS: {},
  WALL: {},
  ADMIN_TOKEN: "test-passcode",
  CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
  ALLOWED_ORIGINS: "https://booth.test",
  RETENTION_DAYS: "30",
} as unknown as AppBindings;
const broadcast = vi.fn();
let stored: string | null;
const patch = (body: unknown, token = "test-passcode") =>
  app.request(
    "/settings/runtime",
    {
      method: "PATCH",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
  );

beforeEach(() => {
  stored = JSON.stringify({ ...DEFAULT_SETTINGS, eventName: "Kept title", eventEnded: true });
  vi.spyOn(adminGuardService, "verify").mockImplementation(
    async ({ token, adminToken }) => token === adminToken,
  );
  vi.spyOn(wallService, "broadcaster").mockReturnValue({ broadcast });
  vi.spyOn(settingsRepo, "get").mockImplementation(async () => stored);
  vi.spyOn(settingsRepo, "compareAndPut").mockImplementation(async (_db, _key, expected, next) => {
    if (stored !== expected) return false;
    stored = next;
    return true;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  broadcast.mockReset();
});

it("sets persistent playback without toggling or changing intake, lifecycle or presentation", async () => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await patch({ playbackPaused: true });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      settings: {
        playbackPaused: true,
        uploadsOpen: true,
        eventEnded: true,
        eventName: "Kept title",
      },
    });
  }
  expect(
    (await (await app.request("/settings", {}, env)).json()) as { settings: WallSettings },
  ).toMatchObject({ settings: { playbackPaused: true } });
  expect((await patch({ uploadsOpen: false })).status).toBe(200);
  expect((await patch({ playbackPaused: false })).status).toBe(200);
  expect(JSON.parse(stored!)).toMatchObject({
    playbackPaused: false,
    uploadsOpen: false,
    eventEnded: true,
  });
  expect(broadcast).toHaveBeenLastCalledWith({
    type: "settings.updated",
    settings: JSON.parse(stored!),
  });
});

it("requires control authority and refuses empty, lifecycle and configured patches", async () => {
  expect((await patch({ playbackPaused: true }, "wrong-passcode")).status).toBe(403);
  for (const body of [
    {},
    { eventEnded: false },
    { eventName: "Changed" },
    { playbackPaused: "true" },
    { uploadsOpen: false, eventName: "Changed" },
  ]) {
    expect((await patch(body)).status).toBe(400);
  }
  expect(settingsRepo.compareAndPut).not.toHaveBeenCalled();
});

it("retries a concurrent presentation change without erasing it", async () => {
  vi.mocked(settingsRepo.compareAndPut).mockImplementationOnce(async () => {
    stored = JSON.stringify({ ...JSON.parse(stored!), announcement: "Changed during pause" });
    return false;
  });
  expect((await patch({ playbackPaused: true })).status).toBe(200);
  expect(JSON.parse(stored!)).toMatchObject({
    playbackPaused: true,
    announcement: "Changed during pause",
  });
  expect(settingsRepo.compareAndPut).toHaveBeenCalledTimes(2);
});

it("keeps desired playback when an older full settings client saves branding", async () => {
  stored = JSON.stringify({ ...JSON.parse(stored!), playbackPaused: true });
  const response = await app.request(
    "/settings",
    {
      method: "PUT",
      headers: { authorization: "Bearer test-passcode", "content-type": "application/json" },
      body: JSON.stringify({ ...DEFAULT_SETTINGS, eventName: "Updated title" }),
    },
    env,
  );
  expect(response.status).toBe(200);
  expect(JSON.parse(stored!)).toMatchObject({
    playbackPaused: true,
    eventName: "Updated title",
    eventEnded: true,
  });
});

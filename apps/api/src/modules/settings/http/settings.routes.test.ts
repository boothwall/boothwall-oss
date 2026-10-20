import { DEFAULT_SETTINGS, type WallSettings } from "@boothwall/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { authFailureRepo } from "@/modules/auth/data/auth-failure.repo";
import { settingsRepo } from "@/modules/settings/data/settings.repo";
import { wallService } from "@/modules/wall";

const PASSCODE = "test-passcode";
const app = createApp({ settingsAuthority: "stored" });
const env = {
  DB: {},
  PHOTOS: {},
  WALL: {},
  ADMIN_TOKEN: PASSCODE,
  CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
  ALLOWED_ORIGINS: "https://booth.test",
  RETENTION_DAYS: "30",
} as unknown as AppBindings;

const put = (body: unknown, passcode = PASSCODE) =>
  app.request(
    "/settings",
    {
      method: "PUT",
      headers: { authorization: `Bearer ${passcode}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    env,
  );

const broadcast = vi.fn();

beforeEach(() => {
  vi.spyOn(authFailureRepo, "countSince").mockResolvedValue(0);
  vi.spyOn(authFailureRepo, "add").mockResolvedValue();
  vi.spyOn(wallService, "broadcaster").mockReturnValue({ broadcast });
});

afterEach(() => {
  vi.restoreAllMocks();
  broadcast.mockReset();
});

describe("GET /settings", () => {
  it("uses the config defaults until something is saved", async () => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue(null);
    const res = await app.request("/settings", {}, env);
    expect(await res.json()).toEqual({ settings: DEFAULT_SETTINGS });
  });

  it("keeps saved fields that still fit and drops ones that don't", async () => {
    const stored = { announcement: "Keynote at 14:00", captionStyle: "comic-sans" };
    vi.spyOn(settingsRepo, "get").mockResolvedValue(JSON.stringify(stored));
    const res = await app.request("/settings", {}, env);
    const { settings } = (await res.json()) as { settings: WallSettings };
    expect(settings.announcement).toBe("Keynote at 14:00");
    expect(settings.captionStyle).toBe(DEFAULT_SETTINGS.captionStyle);
  });
});

describe("PUT /settings", () => {
  beforeEach(() => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue(null);
  });

  it("saves the settings and pushes them to every wall", async () => {
    const save = vi.spyOn(settingsRepo, "compareAndPut").mockResolvedValue(true);
    const next = { ...DEFAULT_SETTINGS, uploadsOpen: false, secondsPerPhoto: 12 };
    const res = await put(next);
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledWith(
      expect.anything(),
      "wall",
      null,
      JSON.stringify(next),
      expect.any(Date),
    );
    expect(broadcast).toHaveBeenCalledWith({ type: "settings.updated", settings: next });
  });

  it("needs the passcode and a valid body", async () => {
    const save = vi.spyOn(settingsRepo, "compareAndPut").mockResolvedValue(true);
    expect((await put(DEFAULT_SETTINGS, "wrong-passcode")).status).toBe(403);
    expect((await put({ ...DEFAULT_SETTINGS, secondsPerPhoto: 1 })).status).toBe(400);
    expect((await put({ ...DEFAULT_SETTINGS, captionStyle: "comic-sans" })).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });
});

describe("ending the event", () => {
  it("is its own action: the settings form can't end or reopen it", async () => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue(JSON.stringify({ announcement: "Hi" }));
    const save = vi.spyOn(settingsRepo, "compareAndPut").mockResolvedValue(true);
    const end = await app.request(
      "/event/end",
      { method: "POST", headers: { authorization: `Bearer ${PASSCODE}` } },
      env,
    );
    const { settings } = (await end.json()) as { settings: WallSettings };
    expect(settings).toMatchObject({ eventEnded: true, announcement: "Hi" });
    expect(broadcast).toHaveBeenCalledWith({ type: "settings.updated", settings });

    vi.spyOn(settingsRepo, "get").mockResolvedValue(JSON.stringify(settings));
    await put({ ...settings, eventEnded: false });
    expect(JSON.parse(save.mock.calls.at(-1)?.[3] ?? "{}")).toMatchObject({ eventEnded: true });
    expect((await app.request("/event/end", { method: "POST" }, env)).status).toBe(403);
  });
});

describe("uploads", () => {
  it("are refused while the booth has them turned off", async () => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue(JSON.stringify({ uploadsOpen: false }));
    const res = await app.request(
      "/photos",
      { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x" }, body: "" },
      env,
    );
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      "PHOTO_UPLOADS_CLOSED",
    );
  });
});

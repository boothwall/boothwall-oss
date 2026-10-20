import { DEFAULT_SETTINGS, DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Db } from "@/db/client";
import { settingsRepo } from "@/modules/settings/data/settings.repo";

import { settingsKey, settingsService } from "./settings.service";

const db = {} as Db;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("settingsKey", () => {
  it("keeps the original row for the default wall", () => {
    expect(settingsKey(DEFAULT_WALL_ID)).toBe("wall");
  });

  it("gives every other wall its own row", () => {
    expect(settingsKey("acme")).toBe("wall:acme");
  });
});

describe("settingsService", () => {
  it("reads and writes the default wall's settings under the original key", async () => {
    const get = vi.spyOn(settingsRepo, "get").mockResolvedValue('{"uploadsOpen":false}');
    const put = vi.spyOn(settingsRepo, "compareAndPut").mockResolvedValue(true);

    expect((await settingsService.get(db, DEFAULT_WALL_ID)).uploadsOpen).toBe(false);
    await settingsService.save(
      {
        settingsAuthority: "stored" as const,
        db,
        wallId: DEFAULT_WALL_ID,
        wall: { broadcast: vi.fn() },
      },
      DEFAULT_SETTINGS,
    );

    expect(get).toHaveBeenCalledWith(db, "wall");
    expect(put).toHaveBeenCalledWith(
      db,
      "wall",
      '{"uploadsOpen":false}',
      JSON.stringify(DEFAULT_SETTINGS),
      expect.any(Date),
    );
  });

  it("fills event fields a row saved before they existed from the config, and keeps saved ones", async () => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue('{"announcement":"Hi","eventHashtag":"#Live"}');

    const settings = await settingsService.get(db, DEFAULT_WALL_ID);

    expect(settings.announcement).toBe("Hi");
    expect(settings.eventHashtag).toBe("#Live");
    expect(settings.eventName).toBe(DEFAULT_SETTINGS.eventName);
    expect(settings.eventYear).toBe(DEFAULT_SETTINGS.eventYear);
  });

  it("falls back to the config's hashtag when a saved one doesn't fit", async () => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue('{"eventHashtag":"no hash"}');
    expect((await settingsService.get(db, DEFAULT_WALL_ID)).eventHashtag).toBe(
      DEFAULT_SETTINGS.eventHashtag,
    );
  });
});

it("rejects a second host's stale save rather than losing the first host's fields", async () => {
  const { settingsVersion } = await import("@boothwall/shared");
  vi.spyOn(settingsRepo, "get").mockResolvedValue(
    JSON.stringify({ ...DEFAULT_SETTINGS, eventName: "First host" }),
  );
  const put = vi.spyOn(settingsRepo, "put").mockResolvedValue();
  await expect(
    settingsService.save(
      {
        settingsAuthority: "stored" as const,
        db,
        wallId: DEFAULT_WALL_ID,
        wall: { broadcast: vi.fn() },
      },
      { ...DEFAULT_SETTINGS, eventName: "Second host" },
      await settingsVersion(DEFAULT_SETTINGS),
    ),
  ).rejects.toMatchObject({ status: 409, code: "SETTINGS_CONFLICT" });
  expect(put).not.toHaveBeenCalled();
});

it("ending an event retries a concurrent settings edit without erasing it", async () => {
  const newer = { ...DEFAULT_SETTINGS, eventName: "New title", announcement: "Welcome" };
  vi.spyOn(settingsRepo, "get")
    .mockResolvedValueOnce(JSON.stringify(DEFAULT_SETTINGS))
    .mockResolvedValue(JSON.stringify(newer));
  vi.spyOn(settingsRepo, "put").mockResolvedValue();
  const compare = vi
    .spyOn(settingsRepo, "compareAndPut")
    .mockResolvedValueOnce(false)
    .mockResolvedValue(true);
  const result = await settingsService.setEventEnded(
    { settingsAuthority: "stored" as const, db, wallId: "a", wall: { broadcast: vi.fn() } },
    true,
  );
  expect(result).toEqual({ ...newer, eventEnded: true });
  expect(compare).toHaveBeenCalledTimes(2);
});

it("preserves presentation in legacy saves and supports explicit reset", async () => {
  const presentation = { badge: "Afterparty", logoUrl: "https://images.example.test/logo.png" };
  vi.spyOn(settingsRepo, "get").mockResolvedValue(
    JSON.stringify({ ...DEFAULT_SETTINGS, presentation }),
  );
  const put = vi.spyOn(settingsRepo, "compareAndPut").mockResolvedValue(true);
  const deps = {
    settingsAuthority: "stored" as const,
    db,
    wallId: DEFAULT_WALL_ID,
    wall: { broadcast: vi.fn() },
  };
  expect((await settingsService.save(deps, DEFAULT_SETTINGS)).presentation).toEqual(presentation);
  expect(JSON.parse(put.mock.calls[0]![3]).presentation).toEqual(presentation);
  expect(
    (await settingsService.save(deps, { ...DEFAULT_SETTINGS, presentation: {} })).presentation,
  ).toEqual({});
});

import { DEFAULT_SETTINGS, DEFAULT_WALL_ID } from "@boothwall/shared";
import { afterEach, expect, it, vi } from "vitest";

import type { Db } from "@/db/client";
import { settingsRepo } from "@/modules/settings/data/settings.repo";

import { settingsService } from "./settings.service";

afterEach(() => vi.restoreAllMocks());

it("persists only runtime flags for a fresh configured wall and retains them on subsequent reads", async () => {
  let stored: string | null = null;
  vi.spyOn(settingsRepo, "get").mockImplementation(async () => stored);
  vi.spyOn(settingsRepo, "compareAndPut").mockImplementation(async (_db, _key, expected, next) => {
    if (stored !== expected) return false;
    stored = next;
    return true;
  });
  const deps = { db: {} as Db, wallId: DEFAULT_WALL_ID, wall: { broadcast: vi.fn() } };
  await settingsService.setRuntimeState(deps, { playbackPaused: true, uploadsOpen: false });
  expect(JSON.parse(stored!)).toEqual({
    kind: "configured-runtime",
    schemaVersion: 1,
    runtimeState: { playbackPaused: true, uploadsOpen: false, eventEnded: false },
  });
  expect(await settingsService.get(deps.db, deps.wallId)).toEqual({
    ...DEFAULT_SETTINGS,
    playbackPaused: true,
    uploadsOpen: false,
  });
});

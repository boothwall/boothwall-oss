import {
  DEFAULT_WALL_ID,
  type RuntimeSettingsPatch,
  settingsVersion,
  type WallId,
  type WallSettings,
} from "@boothwall/shared";

import type { SettingsAuthority } from "@/contracts/runtime";
import { ServiceError } from "@/core/http/errors";
import type { Db } from "@/db/client";
import { settingsRepo } from "@/modules/settings/data/settings.repo";
import type { SettingsDeps } from "@/modules/settings/domain/settings.types";

import { settingsConflict, settingsStateInvalid } from "./settings.errors";
import { resolveSettingsRecord, runtimeSettingsRecord } from "./settings-record.utils";

/**
 * The settings row of a wall. The default wall keeps the key it had before walls had ids,
 * so existing deployments read their saved settings unchanged.
 */
export const settingsKey = (wallId: WallId) =>
  wallId === DEFAULT_WALL_ID ? "wall" : `wall:${wallId}`;

/**
 * Stores the settings and pushes them to every connected wall. The save stands even if the
 * push fails: screens pick the settings up with their next snapshot.
 */
const write = async (
  { db, wall, wallId, now }: SettingsDeps,
  next: WallSettings,
  expected?: string | null,
  record = JSON.stringify(next),
): Promise<WallSettings> => {
  if (expected !== undefined) {
    if (
      !(await settingsRepo.compareAndPut(
        db,
        settingsKey(wallId),
        expected,
        record,
        now?.() ?? new Date(),
      ))
    )
      throw settingsConflict();
  } else {
    await settingsRepo.put(db, settingsKey(wallId), record, now?.() ?? new Date());
  }
  try {
    await wall.broadcast({ type: "settings.updated", settings: next });
  } catch (err) {
    console.error("settings.updated broadcast failed", err);
  }
  return next;
};

export const settingsService = {
  /**
   * The saved settings over the config defaults. A stored value that no longer fits the
   * schema (a style removed in a later version, say) falls back to the default.
   */
  async inspect(db: Db, wallId: WallId, authority: SettingsAuthority = "configured") {
    return resolveSettingsRecord(await settingsRepo.get(db, settingsKey(wallId)), authority);
  },

  async get(
    db: Db,
    wallId: WallId,
    authority: SettingsAuthority = "configured",
  ): Promise<WallSettings> {
    return (await this.inspect(db, wallId, authority)).settings;
  },

  /**
   * Saves the settings from the Control panel's form. Whether the event has ended isn't a
   * setting the form changes (see `setEventEnded`), so it keeps its stored value.
   */
  async save(
    deps: SettingsDeps,
    form: WallSettings,
    expectedVersion?: string,
  ): Promise<WallSettings> {
    if (deps.settingsAuthority !== "stored") throw settingsStateInvalid();
    const stored = await settingsRepo.get(deps.db, settingsKey(deps.wallId));
    const current = resolveSettingsRecord(stored, "stored").settings;
    if (expectedVersion && (await settingsVersion(current)) !== expectedVersion)
      throw settingsConflict();
    return write(
      deps,
      {
        ...form,
        presentation: form.presentation ?? current.presentation,
        eventEnded: current.eventEnded,
        playbackPaused: current.playbackPaused,
      },
      stored,
    );
  },

  /** Applies desired playback/intake without replacing unrelated live or configured fields. */
  async setRuntimeState(deps: SettingsDeps, patch: RuntimeSettingsPatch): Promise<WallSettings> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const stored = await settingsRepo.get(deps.db, settingsKey(deps.wallId));
      try {
        const record = runtimeSettingsRecord(stored, patch, deps.settingsAuthority);
        return await write(
          deps,
          resolveSettingsRecord(record, deps.settingsAuthority).settings,
          stored,
          record,
        );
      } catch (error) {
        if (!(error instanceof ServiceError) || error.code !== "SETTINGS_CONFLICT") throw error;
      }
    }
    throw settingsConflict();
  },

  /** Ends the event (the walls show the recap QR code) or opens it again. */
  async setEventEnded(deps: SettingsDeps, eventEnded: boolean): Promise<WallSettings> {
    if (deps.settingsAuthority !== "stored") throw settingsStateInvalid();
    for (let attempt = 0; attempt < 4; attempt++) {
      const stored = await settingsRepo.get(deps.db, settingsKey(deps.wallId));
      try {
        return await write(
          deps,
          { ...resolveSettingsRecord(stored, "stored").settings, eventEnded },
          stored,
        );
      } catch (error) {
        if (!(error instanceof ServiceError) || error.code !== "SETTINGS_CONFLICT") throw error;
      }
    }
    throw settingsConflict();
  },
};

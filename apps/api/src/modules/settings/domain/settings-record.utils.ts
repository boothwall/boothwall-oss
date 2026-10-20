import {
  configuredRuntimeRecordSchema,
  DEFAULT_SETTINGS,
  type RuntimeSettingsPatch,
  runtimeSettingsPatchSchema,
  type WallSettings,
  wallSettingsSchema,
} from "@boothwall/shared";

import type { SettingsAuthority } from "@/contracts/runtime";

import { settingsStateInvalid } from "./settings.errors";

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function decoded(stored: string | null): unknown {
  try {
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return undefined;
  }
}

/** Legacy data keeps its effective values until the operator applies a reviewed migration. */
export function resolveSettingsRecord(
  stored: string | null,
  authority: SettingsAuthority = "configured",
  defaults: WallSettings = DEFAULT_SETTINGS,
) {
  const raw = decoded(stored);
  if (object(raw) && raw.kind === "configured-runtime") {
    const parsed = configuredRuntimeRecordSchema.safeParse(raw);
    if (!parsed.success || authority === "stored") throw settingsStateInvalid();
    return {
      settings: wallSettingsSchema.parse({ ...defaults, ...parsed.data.runtimeState }),
      authority: "configured" as const,
    };
  }
  if (
    object(raw) &&
    ["kind", "schemaVersion", "runtimeState", "migration"].some((key) => Object.hasOwn(raw, key))
  )
    throw settingsStateInvalid();
  const merged: Record<string, unknown> = { ...defaults };
  if (object(raw))
    for (const [key, value] of Object.entries(raw)) {
      const field = Object.hasOwn(wallSettingsSchema.shape, key)
        ? wallSettingsSchema.shape[key as keyof WallSettings]
        : undefined;
      if (field?.safeParse(value).success) merged[key] = value;
    }
  return {
    settings: wallSettingsSchema.parse(merged),
    authority:
      authority === "stored"
        ? ("stored" as const)
        : stored === null
          ? ("configured" as const)
          : ("legacy-pending" as const),
  };
}

export function runtimeSettingsRecord(
  stored: string | null,
  input: RuntimeSettingsPatch,
  authority: SettingsAuthority = "configured",
) {
  const patch = runtimeSettingsPatchSchema.parse(input);
  const current = resolveSettingsRecord(stored, authority).settings;
  const raw = decoded(stored);
  if (authority === "stored") return JSON.stringify({ ...current, ...patch });
  if (stored === null || (object(raw) && raw.kind === "configured-runtime")) {
    const record =
      stored === null
        ? {
            kind: "configured-runtime" as const,
            schemaVersion: 1 as const,
            runtimeState: {
              playbackPaused: current.playbackPaused,
              uploadsOpen: current.uploadsOpen,
              eventEnded: current.eventEnded,
            },
          }
        : configuredRuntimeRecordSchema.parse(raw);
    return JSON.stringify({ ...record, runtimeState: { ...record.runtimeState, ...patch } });
  }
  // Preserve unknown/invalid legacy fields byte-for-value; never normalize them away on pause.
  if (!object(raw)) throw settingsStateInvalid();
  return JSON.stringify({ ...raw, ...patch });
}

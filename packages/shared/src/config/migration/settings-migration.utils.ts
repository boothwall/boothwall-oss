import { BUILT_IN_SETTINGS, type WallSettings, wallSettingsSchema } from "#settings";

import { type BoothwallConfig, boothwallConfigSchema } from "../schema/boothwall-config.schemas.ts";
import type {
  SettingsMigrationIssue,
  SettingsMigrationPreview,
} from "./settings-migration.types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** Uses the same schema and defaults as the live compatibility reader; never writes settings. */
export function previewSettingsMigration(
  input: BoothwallConfig,
  stored: string | null,
): SettingsMigrationPreview {
  const config = boothwallConfigSchema.parse(input);
  const defaults = wallSettingsSchema.parse({
    ...BUILT_IN_SETTINGS,
    ...config.settings,
    eventName: config.event.name,
    eventHashtag: config.event.hashtag,
    eventYear: config.event.year ?? "",
    categories: config.categories,
  });
  const issues: SettingsMigrationIssue[] = [];
  const merged: Record<string, unknown> = { ...defaults };
  let saved: unknown = {};
  if (stored !== null) {
    try {
      saved = JSON.parse(stored);
    } catch {
      saved = null;
    }
  }
  if (!isRecord(saved)) {
    issues.push({
      field: "$record",
      code: "invalid-record",
      guidance:
        "Recover a JSON settings object from your database backup before changing authority.",
    });
  } else {
    for (const [key, value] of Object.entries(saved)) {
      const schema = Object.hasOwn(wallSettingsSchema.shape, key)
        ? wallSettingsSchema.shape[key as keyof WallSettings]
        : undefined;
      if (!schema) {
        issues.push({
          field: key,
          code: "unknown-field",
          guidance: "Keep the original backup and review this unrecognized field before migration.",
        });
        continue;
      }
      const parsed = schema.safeParse(value);
      if (!parsed.success) {
        issues.push({
          field: key,
          code: "invalid-field",
          guidance:
            "The compatibility reader uses the configured default. Review the original value before applying this patch.",
        });
        continue;
      }
      findUnknown(value, parsed.data, key, issues);
      merged[key] = parsed.data;
    }
  }
  const effective = wallSettingsSchema.parse(merged);
  if (effective.smartModeration.enabled || effective.smartModeration.autoApproveSafe) {
    issues.push({
      field: "smartModeration",
      code: "unsupported-policy",
      guidance:
        "Standalone has no automated review provider. Explicitly disable enabled and autoApproveSafe after reviewing your backup; the preview preserves their values.",
    });
  }
  if (effective.eventEnded) {
    issues.push({
      field: "eventEnded",
      code: "unsupported-policy",
      guidance:
        "This legacy event is ended. Preserve its state; review guest-intake and display behavior before retiring the legacy event lifecycle.",
    });
  }
  const {
    eventName,
    eventHashtag,
    eventYear,
    categories,
    playbackPaused,
    uploadsOpen,
    eventEnded,
    ...settings
  } = effective;
  return {
    schemaVersion: 1,
    ready: issues.length === 0,
    configPatch: {
      event: { ...config.event, name: eventName, hashtag: eventHashtag, year: eventYear },
      categories,
      settings,
    },
    runtimeState: { playbackPaused, uploadsOpen, eventEnded },
    issues,
  };
}

function findUnknown(
  raw: unknown,
  parsed: unknown,
  path: string,
  issues: SettingsMigrationIssue[],
) {
  if (Array.isArray(raw) && Array.isArray(parsed)) {
    raw.forEach((value, index) => findUnknown(value, parsed[index], `${path}.${index}`, issues));
  } else if (isRecord(raw) && isRecord(parsed)) {
    for (const [key, value] of Object.entries(raw)) {
      const field = `${path}.${key}`;
      if (!Object.hasOwn(parsed, key))
        issues.push({
          field,
          code: "unknown-field",
          guidance:
            "Keep the original backup and review this unrecognized nested field before migration.",
        });
      else findUnknown(value, parsed[key], field, issues);
    }
  }
}

import { type ConfiguredRuntimeRecord, configuredRuntimeRecordSchema } from "#settings";

import { type BoothwallConfig, boothwallConfigSchema } from "../schema/boothwall-config.schemas.ts";
import type { SettingsMigrationPreview } from "./settings-migration.types.ts";
import { previewSettingsMigration } from "./settings-migration.utils.ts";

/** Host-provided SHA-256 over UTF-8, without browser/native crypto dependencies here. */
export type SettingsMigrationHasher = (text: string) => string | Promise<string>;

export interface SettingsApplicationInput {
  originalConfig: BoothwallConfig;
  currentConfig: BoothwallConfig;
  stored: string;
  reviewedPreview: SettingsMigrationPreview;
  sources: { configuredSha256: string; storedSha256: string };
  decisions?: { retainEnded?: boolean; disableLegacyReview?: boolean };
}

/** Replay checks immutable provenance, allowing later playback/intake changes to survive. */
export function matchesSettingsApplication(value: unknown, expected: ConfiguredRuntimeRecord) {
  const parsed = configuredRuntimeRecordSchema.safeParse(value);
  return (
    parsed.success &&
    expected.migration !== undefined &&
    JSON.stringify(parsed.data.migration) === JSON.stringify(expected.migration)
  );
}

/** Validates an operator-applied patch; does not edit config, contact a provider or write data. */
export async function prepareSettingsApplication(
  input: SettingsApplicationInput,
  sha256: SettingsMigrationHasher,
) {
  const original = boothwallConfigSchema.parse(input.originalConfig);
  const current = boothwallConfigSchema.parse(input.currentConfig);
  const { stored } = input;
  const [configuredSha256, storedSha256] = await Promise.all([
    sha256(JSON.stringify(original)),
    sha256(stored),
  ]);
  if (
    configuredSha256 !== input.sources.configuredSha256 ||
    storedSha256 !== input.sources.storedSha256
  )
    throw new Error(
      "Migration source identity changed; regenerate the preview from the original backup and configuration.",
    );
  const preview = previewSettingsMigration(original, stored);
  if (JSON.stringify(preview) !== JSON.stringify(input.reviewedPreview))
    throw new Error("Reviewed preview does not match its original sources.");
  const decisions = {
    retainEnded: input.decisions?.retainEnded === true,
    disableLegacyReview: input.decisions?.disableLegacyReview === true,
  };
  for (const issue of preview.issues) {
    if (
      issue.code === "unsupported-policy" &&
      ((issue.field === "eventEnded" && decisions.retainEnded) ||
        (issue.field === "smartModeration" && decisions.disableLegacyReview))
    )
      continue;
    throw new Error(
      `Migration decision required for ${issue.field}; preserve the original backup and resolve this issue.`,
    );
  }
  const settings = { ...preview.configPatch.settings };
  if (decisions.disableLegacyReview)
    settings.smartModeration = {
      ...settings.smartModeration,
      enabled: false,
      autoApproveSafe: false,
    };
  const expected = boothwallConfigSchema.parse({ ...original, ...preview.configPatch, settings });
  if (JSON.stringify(expected) !== JSON.stringify(current))
    throw new Error(
      "Target configuration must exactly apply the reviewed patch and retain other configuration.",
    );
  const targetConfiguredSha256 = await sha256(JSON.stringify(current));
  return {
    expectedStored: stored,
    record: configuredRuntimeRecordSchema.parse({
      kind: "configured-runtime",
      schemaVersion: 1,
      runtimeState: preview.runtimeState,
      migration: {
        originalStored: stored,
        configuredSha256,
        storedSha256,
        targetConfiguredSha256,
        decisions,
      },
    }),
  };
}

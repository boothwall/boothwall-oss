import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";

import { UserError } from "../ui.mjs";
import { sharedConfig } from "./shared-config.mjs";

function readInput(path, maxBytes) {
  if (!path) throw new UserError("Settings apply requires the original input and --preview file.");
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.size > maxBytes)
    throw new UserError("Migration input must be a bounded regular file, not a symbolic link.");
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(readFileSync(path));
  } catch {
    throw new UserError("Migration input must be valid UTF-8; retain the original backup.");
  }
}

/** Local-only verification. A preview from an API envelope cannot stand in for the raw DB row. */
export async function loadSettingsApplication(options, currentConfig) {
  const stored = readInput(options.input, 128 * 1024);
  let report, source;
  try {
    report = JSON.parse(readInput(options.preview, 512 * 1024));
    source = options.sourceConfig
      ? JSON.parse(readInput(options.sourceConfig, 128 * 1024))
      : report.sources?.configuredSnapshot;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError("Migration preview/source configuration must contain valid JSON.");
  }
  if (
    report?.schemaVersion !== 1 ||
    report.kind !== "settings-migration-preview" ||
    report.sources?.algorithm !== "sha256"
  )
    throw new UserError("Unsupported settings migration preview.");
  if (!source)
    throw new UserError(
      "This older preview requires --source-config with its original normalized JSON configuration, or regeneration from the original sources.",
    );
  try {
    return await sharedConfig.prepareSettingsApplication(
      {
        originalConfig: source,
        currentConfig,
        stored,
        reviewedPreview: report.preview,
        sources: report.sources,
        decisions: {
          retainEnded: options.retainEnded,
          disableLegacyReview: options.disableLegacyReview,
        },
      },
      (text) => createHash("sha256").update(text).digest("hex"),
    );
  } catch (error) {
    throw new UserError(
      error instanceof Error ? error.message : "Settings migration validation failed.",
    );
  }
}

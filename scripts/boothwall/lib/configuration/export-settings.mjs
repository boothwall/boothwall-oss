import { createHash } from "node:crypto";
import { lstatSync, readFileSync, writeFileSync } from "node:fs";

import { readConfig } from "../config-file.mjs";
import { UserError } from "../ui.mjs";
import { sharedConfig } from "./shared-config.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");

/** Offline preview only: no provider calls, source writes, or migration application. */
export async function exportSettingsMigration({ input, output }) {
  if (!input || !output)
    throw new UserError("Use settings-preview <saved-settings.json> --output <new-preview.json>.");
  const stat = lstatSync(input);
  if (!stat.isFile() || stat.size > 128 * 1024)
    throw new UserError("Settings input must be a regular JSON file smaller than 128 KiB.");
  const sourceBytes = readFileSync(input);
  let source = null;
  try {
    source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(sourceBytes);
  } catch {
    // Keep invalid input byte-exact; never normalize it into a different ready record.
  }
  const configured = sharedConfig.boothwallConfigSchema.parse(await readConfig());
  let stored = source;
  try {
    const decoded = JSON.parse(source);
    if (decoded && Object.keys(decoded).length === 1 && Object.hasOwn(decoded, "settings"))
      stored = JSON.stringify(decoded.settings);
  } catch {
    /* The pure preview reports corrupt input without discarding it. */
  }
  const preview = sharedConfig.previewSettingsMigration(configured, stored);
  if (source === null) {
    preview.ready = false;
    preview.issues.unshift({
      field: "$record",
      code: "invalid-record",
      guidance:
        "The input is not valid UTF-8. Preserve the original bytes and recover a valid UTF-8 JSON backup before migration.",
    });
  }
  const report = {
    schemaVersion: 1,
    kind: "settings-migration-preview",
    sources: {
      algorithm: "sha256",
      configuredSha256: digest(JSON.stringify(configured)),
      configuredSnapshot: configured,
      storedSha256: digest(sourceBytes),
    },
    preview,
  };
  try {
    writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  } catch (error) {
    if (error.code === "EEXIST")
      throw new UserError(
        "Preview output already exists; choose a new file. Existing files are never overwritten.",
      );
    throw error;
  }
  return report;
}

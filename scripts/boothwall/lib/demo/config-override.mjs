import { readFileSync, writeFileSync } from "node:fs";

import { updateConfig } from "../config-file.mjs";
import { CONFIG_FILE } from "../paths.mjs";

/**
 * Applies `updates` to boothwall.config.ts until the returned `restore` runs. Restoring leaves
 * the file alone, and says so, if someone edited it in the meantime.
 */
export function overrideConfig(updates, { file = CONFIG_FILE, update = updateConfig } = {}) {
  const original = readFileSync(file, "utf8");
  update(updates);
  const written = readFileSync(file, "utf8");
  let settled = false;
  return function restore() {
    if (settled) return true;
    settled = true;
    if (readFileSync(file, "utf8") !== written) return false;
    writeFileSync(file, original);
    return true;
  };
}

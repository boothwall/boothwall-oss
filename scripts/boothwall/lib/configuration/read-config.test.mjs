import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("configuration reload observes an immediate write even within one clock tick", () => {
  const folder = mkdtempSync(join(tmpdir(), "boothwall-config-read-"));
  try {
    copyFileSync(new URL("../config-file.mjs", import.meta.url), join(folder, "config-file.mjs"));
    writeFileSync(
      join(folder, "paths.mjs"),
      `export const CONFIG_FILE = ${JSON.stringify(join(folder, "config.mjs"))};\n`,
    );
    writeFileSync(join(folder, "config.mjs"), "export const boothwallConfig = { value: 1 };\n");
    writeFileSync(
      join(folder, "check.mjs"),
      `
      import assert from "node:assert/strict";
      import { writeFileSync } from "node:fs";
      import { readConfig } from "./config-file.mjs";
      import { CONFIG_FILE } from "./paths.mjs";
      Date.now = () => 1000;
      assert.equal((await readConfig()).value, 1);
      writeFileSync(CONFIG_FILE, "export const boothwallConfig = { value: 2 };\\n");
      assert.equal((await readConfig()).value, 2);
    `,
    );
    const result = spawnSync(process.execPath, [join(folder, "check.mjs")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

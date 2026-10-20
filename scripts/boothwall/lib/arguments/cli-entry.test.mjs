import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { ROOT } from "../paths.mjs";

const run = (...args) =>
  spawnSync(process.execPath, [join(ROOT, "scripts/boothwall/index.mjs"), ...args], {
    encoding: "utf8",
  });

test("the real CLI exports an offline preview, with an explicit unready exit and no input mutation", () => {
  const folder = mkdtempSync(join(tmpdir(), "boothwall-cli-"));
  const input = join(folder, "settings.json");
  const output = join(folder, "preview.json");
  writeFileSync(input, '{"unknown":"secret-not-in-output"}');
  const result = run("settings-preview", input, "--output", output);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(readFileSync(output, "utf8")).preview.ready, false);
  assert.equal(readFileSync(input, "utf8"), '{"unknown":"secret-not-in-output"}');
  assert.ok(
    !`${result.stdout}${result.stderr}${readFileSync(output, "utf8")}`.includes(
      "secret-not-in-output",
    ),
  );
  assert.equal(run("settings-preview", input, "--output", output).status, 1);
});

test("help and invalid remote-operation flags exit before starting any operation", () => {
  assert.equal(run("help").status, 0);
  assert.equal(run("deploy", "--local").status, 1);
  assert.match(run("setup", "--account", "wrong").stderr, /option/i);
});

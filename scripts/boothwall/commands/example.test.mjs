import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { EXAMPLES_DIR } from "../lib/paths.mjs";
import { strayFiles } from "./example.mjs";

const scratch = (files) => {
  const dir = mkdtempSync(join(tmpdir(), "boothwall-example-"));
  for (const file of files) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), "");
  }
  return dir;
};

test("every shipped example only replaces files in folders the repo has", () => {
  const examples = readdirSync(EXAMPLES_DIR, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );
  assert.ok(examples.length > 0);
  for (const example of examples)
    assert.deepEqual(strayFiles(join(EXAMPLES_DIR, example.name)), [], example.name);
});

test("a file for a folder the repo doesn't have is stray", () => {
  const root = scratch(["apps/tv-vega/assets/image/app_icon.png", "packages/shared/x.ts"]);
  const example = scratch([
    "apps/tv/assets/image/app_icon.png",
    "apps/tv-vega/assets/image/app_icon.png",
    "packages/shared/new-file.ts",
    "README.md",
  ]);
  assert.deepEqual(strayFiles(example, root), ["apps/tv/assets/image/app_icon.png"]);
});

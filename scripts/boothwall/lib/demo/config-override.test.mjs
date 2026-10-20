import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { overrideConfig } from "./config-override.mjs";

const scratch = () => join(mkdtempSync(join(tmpdir(), "boothwall-config-")), "boothwall.config.ts");
const updateIn = (file) => () => writeFileSync(file, "pointed at this machine");

test("restore puts the original config back, once", () => {
  const file = scratch();
  writeFileSync(file, "original");
  const restore = overrideConfig([], { file, update: updateIn(file) });
  assert.equal(readFileSync(file, "utf8"), "pointed at this machine");
  assert.equal(restore(), true);
  assert.equal(readFileSync(file, "utf8"), "original");
  writeFileSync(file, "edited after the demo");
  assert.equal(restore(), true);
  assert.equal(readFileSync(file, "utf8"), "edited after the demo");
});

test("restore keeps edits made while the demo ran", () => {
  const file = scratch();
  writeFileSync(file, "original");
  const restore = overrideConfig([], { file, update: updateIn(file) });
  writeFileSync(file, "edited during the demo");
  assert.equal(restore(), false);
  assert.equal(readFileSync(file, "utf8"), "edited during the demo");
});

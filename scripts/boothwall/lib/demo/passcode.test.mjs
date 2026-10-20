import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { localPasscode } from "./passcode.mjs";

const fixture = (t) => {
  const directory = mkdtempSync(join(tmpdir(), "boothwall-passcode-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, ".dev.vars");
};

test("generates a passcode for the example's empty value and keeps it afterwards", (t) => {
  const path = fixture(t);
  writeFileSync(path, "# Control passcode\nADMIN_TOKEN=\nCLIENT_FINGERPRINT_KEY=\n");
  const first = localPasscode(path);
  assert.equal(first.created, true);
  assert.match(first.passcode, /^\d{8}$/);
  assert.equal(readFileSync(path, "utf8").match(/^ADMIN_TOKEN=/gm).length, 1);
  assert.deepEqual(localPasscode(path), { passcode: first.passcode, created: false });
});

test("refuses the published placeholder instead of printing it as the passcode", (t) => {
  const path = fixture(t);
  const text = "ADMIN_TOKEN=change-me-to-a-long-random-string\n";
  writeFileSync(path, text);
  assert.throws(() => localPasscode(path), /placeholder/);
  assert.equal(readFileSync(path, "utf8"), text);
});

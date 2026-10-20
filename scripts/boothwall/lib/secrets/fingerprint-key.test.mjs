import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { ensureFingerprintKeyFile } from "./secret-file.mjs";

const fixture = (t) => {
  const directory = mkdtempSync(join(tmpdir(), "fingerprint-key-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, ".dev.vars");
};
test("creates a separate random private key while preserving a short local Control passcode", async (t) => {
  const path = fixture(t);
  const before = "ADMIN_TOKEN=12345678\nOTHER=preserved\n";
  writeFileSync(path, before, { mode: 0o644 });
  assert.deepEqual(await ensureFingerprintKeyFile(path), { created: true });
  const saved = readFileSync(path, "utf8");
  assert.ok(saved.startsWith(before));
  assert.match(saved.slice(before.length), /^CLIENT_FINGERPRINT_KEY=[A-Za-z0-9_-]{43}\n$/);
  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.deepEqual(await ensureFingerprintKeyFile(path), { created: false });
  assert.equal(readFileSync(path, "utf8"), saved);
});
test("does not replace weak or ambiguous configured keys or accept a weak generator", async (t) => {
  const path = fixture(t);
  await assert.rejects(ensureFingerprintKeyFile(path, { generateSecret: () => "short" }), /32/);
  for (const text of [
    "CLIENT_FINGERPRINT_KEY=short\n",
    "CLIENT_FINGERPRINT_KEY=" +
      "x".repeat(32) +
      "\nCLIENT_FINGERPRINT_KEY: " +
      "y".repeat(32) +
      "\n",
  ]) {
    writeFileSync(path, text);
    await assert.rejects(ensureFingerprintKeyFile(path), /ambiguous|unsafe/);
    assert.equal(readFileSync(path, "utf8"), text);
  }
});

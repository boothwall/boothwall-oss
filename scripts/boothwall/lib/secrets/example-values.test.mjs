import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { API_DIR } from "../paths.mjs";
import { ensureFingerprintKeyFile, ensureSecretFile } from "./secret-file.mjs";

const noPrompt = () => {
  throw Error("Must not prompt");
};
const fixture = (t) => {
  const directory = mkdtempSync(join(tmpdir(), "boothwall-example-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, ".dev.vars");
};

test("fills the shipped example's empty values in place, keeping its comments", async (t) => {
  const path = fixture(t);
  copyFileSync(join(API_DIR, ".dev.vars.example"), path);
  const example = readFileSync(path, "utf8");
  assert.match(example, /^ADMIN_TOKEN=$/m);
  assert.match(example, /^CLIENT_FINGERPRINT_KEY=$/m);
  await ensureSecretFile(path, {
    askSecret: async () => "",
    generateSecret: () => "generated-passcode",
  });
  await ensureFingerprintKeyFile(path);
  const saved = readFileSync(path, "utf8");
  assert.match(saved, /^ADMIN_TOKEN=generated-passcode$/m);
  assert.match(saved, /^CLIENT_FINGERPRINT_KEY=[A-Za-z0-9_-]{43}$/m);
  assert.equal(saved.split("\n").length, example.split("\n").length);
  assert.deepEqual(await ensureSecretFile(path, { askSecret: noPrompt }), { created: false });
  assert.deepEqual(await ensureFingerprintKeyFile(path), { created: false });
});

test("refuses the published placeholder and any value the example ships, changing nothing", async (t) => {
  const path = fixture(t);
  writeFileSync(
    `${path}.example`,
    `ADMIN_TOKEN=shipped-example-passcode\nCLIENT_FINGERPRINT_KEY=${"k".repeat(40)}\n`,
  );
  for (const [ensure, text] of [
    [ensureSecretFile, "ADMIN_TOKEN=change-me-to-a-long-random-string\n"],
    [ensureSecretFile, "ADMIN_TOKEN='shipped-example-passcode'\n"],
    [ensureFingerprintKeyFile, `CLIENT_FINGERPRINT_KEY=${"k".repeat(40)}\n`],
  ]) {
    writeFileSync(path, text);
    await assert.rejects(ensure(path, { askSecret: noPrompt }), /placeholder/);
    assert.equal(readFileSync(path, "utf8"), text);
  }
});

test("a blank line in an example never refuses a real value", async (t) => {
  const path = fixture(t);
  writeFileSync(`${path}.example`, "ADMIN_TOKEN=\n");
  writeFileSync(path, "ADMIN_TOKEN=my-own-long-passcode\n");
  assert.deepEqual(await ensureSecretFile(path, { askSecret: noPrompt }), { created: false });
});

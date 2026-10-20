import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { exportSettingsMigration } from "./export-settings.mjs";

const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), "boothwall-migration-"));
  const input = join(dir, "saved-settings.json");
  const output = join(dir, "preview.json");
  writeFileSync(
    input,
    JSON.stringify({
      announcement: "Next session at 16:00",
      showWhoIsHere: false,
      uploadsOpen: false,
    }),
  );
  return { input, output };
};

test("exports a source-identified preview without changing input and refuses to overwrite output", async () => {
  const paths = fixture();
  const before = readFileSync(paths.input);
  const report = await exportSettingsMigration(paths);
  assert.equal(report.sources.storedSha256, createHash("sha256").update(before).digest("hex"));
  assert.match(report.sources.configuredSha256, /^[a-f0-9]{64}$/);
  assert.equal(report.preview.runtimeState.uploadsOpen, false);
  assert.equal(report.preview.configPatch.settings.showWhoIsHere, false);
  assert.equal(report.preview.configPatch.settings.announcement, "Next session at 16:00");
  assert.equal(statSync(paths.output).mode & 0o777, 0o600);
  assert.deepEqual(readFileSync(paths.input), before);
  await assert.rejects(exportSettingsMigration(paths), /exist|overwrite/i);
});

test("exports unready findings for malformed and unsupported records, without applying anything", async () => {
  for (const input of ["{", '{"unknownSetting":"do-not-copy"}']) {
    const paths = fixture();
    writeFileSync(paths.input, input);
    const report = await exportSettingsMigration(paths);
    assert.equal(report.preview.ready, false);
    assert.ok(report.preview.issues.length > 0);
    assert.equal(readFileSync(paths.input, "utf8"), input);
    assert.ok(!readFileSync(paths.output, "utf8").includes("do-not-copy"));
  }
});

test("accepts the existing settings response envelope while binding its exact source bytes", async () => {
  const paths = fixture();
  writeFileSync(paths.input, '{"settings":{"eventName":"Saved title","announcement":""}}');
  const report = await exportSettingsMigration(paths);
  assert.equal(report.preview.ready, true);
  assert.equal(report.preview.configPatch.event.name, "Saved title");
});

test("hashes original bytes so invalid UTF-8 inputs cannot collapse to the same source identity", async () => {
  const hashes = [];
  for (const byte of [0xff, 0xfe]) {
    const paths = fixture();
    const original = Buffer.concat([
      Buffer.from('{"announcement":"'),
      Buffer.from([byte]),
      Buffer.from('"}'),
    ]);
    writeFileSync(paths.input, original);
    const report = await exportSettingsMigration(paths);
    assert.equal(report.sources.storedSha256, createHash("sha256").update(original).digest("hex"));
    hashes.push(report.sources.storedSha256);
    assert.deepEqual(readFileSync(paths.input), original);
  }
  assert.notEqual(hashes[0], hashes[1]);
});

test("invalid UTF-8 produces an unready encoding finding, never a replacement-character presentation", async () => {
  const paths = fixture();
  const original = Buffer.concat([
    Buffer.from('{"announcement":"'),
    Buffer.from([0xff]),
    Buffer.from('"}'),
  ]);
  writeFileSync(paths.input, original);
  const report = await exportSettingsMigration(paths);
  assert.equal(report.preview.ready, false);
  assert.ok(
    report.preview.issues.some(
      (issue) => issue.field === "$record" && /UTF-8/.test(issue.guidance),
    ),
  );
  assert.ok(!JSON.stringify(report.preview.configPatch).includes("\uFFFD"));
  assert.deepEqual(readFileSync(paths.input), original);
});

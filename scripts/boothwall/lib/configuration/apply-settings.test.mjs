import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import { exportSettingsMigration } from "./export-settings.mjs";
import { loadSettingsApplication } from "./load-settings-application.mjs";
import { applicationQueries, applicationResult } from "./settings-application-sql.mjs";
import { sharedConfig } from "./shared-config.mjs";

test("reviewed apply uses exact original row CAS and replay retains later runtime changes", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "settings-apply-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = join(directory, "original.json"),
    preview = join(directory, "preview.json");
  const original = '{ "announcement":"Preserved", "uploadsOpen":false }';
  writeFileSync(input, original);
  const report = await exportSettingsMigration({ input, output: preview });
  const current = { ...sharedConfig.boothwallConfig, ...report.preview.configPatch };
  const plan = await loadSettingsApplication({ input, preview }, current);
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at INTEGER NOT NULL)",
  );
  db.exec(
    readFileSync(
      new URL("../../../../apps/api/migrations/0010_settings_authority.sql", import.meta.url),
      "utf8",
    ),
  );
  db.prepare("INSERT INTO settings VALUES('wall',?,0)").run(original);
  const run = () =>
    applicationQueries(plan, 123).map(({ sql, params }) => ({
      success: true,
      results: db.prepare(sql).all(...params),
    }));
  try {
    assert.equal(applicationResult(run(), plan), "applied");
    const updated = JSON.parse(db.prepare("SELECT value FROM settings").get().value);
    updated.runtimeState.playbackPaused = true;
    db.prepare("UPDATE settings SET value=?").run(JSON.stringify(updated));
    assert.equal(applicationResult(run(), plan), "already-applied");
    assert.equal(
      JSON.parse(db.prepare("SELECT value FROM settings").get().value).runtimeState.playbackPaused,
      true,
    );
    assert.equal(readFileSync(input, "utf8"), original);
  } finally {
    db.close();
  }
});

test("apply refuses a database missing the installed immutable-authority fences", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "settings-apply-schema-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = join(directory, "original.json"),
    preview = join(directory, "preview.json");
  const original = '{"uploadsOpen":false}';
  writeFileSync(input, original);
  const report = await exportSettingsMigration({ input, output: preview });
  const plan = await loadSettingsApplication(
    { input, preview },
    { ...sharedConfig.boothwallConfig, ...report.preview.configPatch },
  );
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at INTEGER NOT NULL)",
  );
  db.prepare("INSERT INTO settings VALUES('wall',?,0)").run(original);
  try {
    const result = applicationQueries(plan).map(({ sql, params }) => ({
      success: true,
      results: db.prepare(sql).all(...params),
    }));
    assert.throws(() => applicationResult(result, plan), /migration.*0010|fences/i);
    assert.equal(db.prepare("SELECT value FROM settings").get().value, original);
    db.exec(
      readFileSync(
        new URL("../../../../apps/api/migrations/0010_settings_authority.sql", import.meta.url),
        "utf8",
      ),
    );
    db.exec(
      "DROP TRIGGER settings_configured_runtime_update; CREATE TRIGGER settings_configured_runtime_update BEFORE UPDATE ON settings BEGIN SELECT 1; END",
    );
    const weakened = applicationQueries(plan).map(({ sql, params }) => ({
      success: true,
      results: db.prepare(sql).all(...params),
    }));
    assert.throws(() => applicationResult(weakened, plan), /fences/i);
    assert.equal(db.prepare("SELECT value FROM settings").get().value, original);
  } finally {
    db.close();
  }
});

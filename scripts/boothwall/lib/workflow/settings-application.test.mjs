import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import { exportSettingsMigration, sharedConfig } from "../configuration/index.mjs";
import { runSettingsApplication } from "./settings-application.mjs";

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "settings-workflow-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const input = join(dir, "raw.json"),
    preview = join(dir, "preview.json");
  writeFileSync(input, '{"announcement":"File source","playbackPaused":true}');
  const report = await exportSettingsMigration({ input, output: preview });
  return {
    input,
    preview,
    local: true,
    current: { ...sharedConfig.boothwallConfig, ...report.preview.configPatch },
  };
}

test("local apply uses an owner-only request file, truthful receipt and safe retry after lost response", async (t) => {
  const f = await fixture(t);
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
  db.prepare("INSERT INTO settings VALUES('wall',?,0)").run(readFileSync(f.input, "utf8"));
  let first = true,
    requestPath;
  const deps = {
    readConfig: async () => f.current,
    confirm: async () => true,
    log() {},
    run: async (args, options) => {
      assert.ok(args.includes("--local"));
      assert.equal(options.sensitive, true);
      requestPath = args[args.indexOf("--batch") + 1].slice(1);
      assert.equal(statSync(requestPath).mode & 0o777, 0o600);
      const result = JSON.parse(readFileSync(requestPath, "utf8")).map(({ sql, params }) => ({
        success: true,
        results: db.prepare(sql).all(...params),
      }));
      if (first) {
        first = false;
        throw Error("Response lost after commit");
      }
      return JSON.stringify(result);
    },
  };
  try {
    await assert.rejects(runSettingsApplication(f, deps), /Response lost/);
    assert.equal(existsSync(requestPath), false);
    assert.equal(await runSettingsApplication(f, deps), "already-applied");
    assert.equal(existsSync(requestPath), false);
  } finally {
    db.close();
  }
});

test("a config or original-input change during confirmation executes no database query", async (t) => {
  for (const changed of ["config", "input"]) {
    const f = await fixture(t);
    let calls = 0;
    await assert.rejects(
      runSettingsApplication(f, {
        readConfig: async () => f.current,
        log() {},
        run: async () => {
          calls++;
        },
        confirm: async () => {
          if (changed === "config")
            f.current = { ...f.current, retentionDays: f.current.retentionDays + 1 };
          else writeFileSync(f.input, readFileSync(f.input, "utf8") + " ");
          return true;
        },
      }),
      /changed|identity/i,
    );
    assert.equal(calls, 0);
  }
});

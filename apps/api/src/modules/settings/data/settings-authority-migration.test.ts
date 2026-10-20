import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { URL } from "node:url";

import { expect, it } from "vitest";

it("fences legacy update, replace, downgrade and deletion after configuration migration", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at INTEGER NOT NULL)",
  );
  db.exec(
    readFileSync(
      new URL("../../../../migrations/0010_settings_authority.sql", import.meta.url),
      "utf8",
    ),
  );
  const legacy = '{"announcement":"Keep me","uploadsOpen":false}';
  const record = JSON.stringify({
    kind: "configured-runtime",
    schemaVersion: 1,
    runtimeState: { playbackPaused: false, uploadsOpen: false, eventEnded: true },
    migration: {
      originalStored: legacy,
      storedSha256: "a".repeat(64),
      configuredSha256: "b".repeat(64),
      targetConfiguredSha256: "c".repeat(64),
      decisions: { retainEnded: true, disableLegacyReview: false },
    },
  });
  db.prepare("INSERT INTO settings VALUES('wall',?,1)").run(record);
  try {
    for (const sql of [
      "UPDATE settings SET value=? WHERE key='wall'",
      "INSERT OR REPLACE INTO settings VALUES('wall',?,2)",
      "INSERT INTO settings VALUES('wall',?,2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    ])
      expect(() => db.prepare(sql).run(legacy)).toThrow(/SETTINGS_CONFIGURED_RUNTIME/);
    expect(() => db.exec("DELETE FROM settings WHERE key='wall'")).toThrow(
      /SETTINGS_CONFIGURED_RUNTIME/,
    );
    const next = JSON.parse(record);
    next.runtimeState.playbackPaused = true;
    db.prepare("UPDATE settings SET value=? WHERE key='wall'").run(JSON.stringify(next));
    for (const corrupt of [
      { ...next, schemaVersion: 0 },
      { ...next, migration: undefined },
      { ...next, announcement: "Hidden edit" },
      { ...next, runtimeState: { ...next.runtimeState, eventEnded: false } },
    ])
      expect(() =>
        db.prepare("UPDATE settings SET value=? WHERE key='wall'").run(JSON.stringify(corrupt)),
      ).toThrow(/SETTINGS_CONFIGURED_RUNTIME/);
    expect(JSON.parse(String(db.prepare("SELECT value FROM settings").get()?.value))).toEqual(next);
    db.prepare("INSERT INTO settings VALUES('wall:second',?,1)").run(legacy);
    db.prepare("UPDATE settings SET value=? WHERE key='wall:second'").run(
      '{"announcement":"Updated"}',
    );
    db.exec("DELETE FROM settings WHERE key='wall:second'");
  } finally {
    db.close();
  }
});

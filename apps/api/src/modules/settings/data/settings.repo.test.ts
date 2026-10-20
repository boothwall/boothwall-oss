import { DatabaseSync } from "node:sqlite";

import { drizzle } from "drizzle-orm/sqlite-proxy";
import { expect, it } from "vitest";

import type { Db } from "@/db/client";

import { settingsRepo } from "./settings.repo";

it("does not recreate settings deleted after a compare-and-swap read", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    "CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)",
  );
  const db = drizzle(async (query, params) => {
    const statement = sqlite.prepare(query);
    statement.setReturnArrays(true);
    return { rows: statement.all(...params) };
  }) as unknown as Db;
  try {
    expect(await settingsRepo.compareAndPut(db, "wall:a", null, "initial", new Date())).toBe(true);
    expect(await settingsRepo.compareAndPut(db, "wall:a", null, "other", new Date())).toBe(false);
    expect(await settingsRepo.compareAndPut(db, "wall:a", "initial", "edited", new Date())).toBe(
      true,
    );
    expect(await settingsRepo.compareAndPut(db, "wall:a", "initial", "stale", new Date())).toBe(
      false,
    );
    sqlite.exec("DELETE FROM settings");
    expect(await settingsRepo.compareAndPut(db, "wall:a", "edited", "late", new Date())).toBe(
      false,
    );
    expect(sqlite.prepare("SELECT count(*) AS n FROM settings").get()?.n).toBe(0);
  } finally {
    sqlite.close();
  }
});

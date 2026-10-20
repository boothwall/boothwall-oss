/** Settings rows. The only file in this module that talks to D1. */
import { and, eq, sql } from "drizzle-orm";

import type { Db } from "@/db/client";
import { settings } from "@/db/schema";

export const settingsRepo = {
  async get(db: Db, key: string): Promise<string | null> {
    const row = await db.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value ?? null;
  },

  /** Atomic compare-and-swap, including the initially absent settings row. */
  async compareAndPut(
    db: Db,
    key: string,
    expected: string | null,
    value: string,
    now: Date,
  ): Promise<boolean> {
    const rows =
      expected === null
        ? await db.all<{ key: string }>(sql`
            INSERT INTO settings(key, value, updated_at)
            SELECT ${key}, ${value}, ${now.getTime()}
            WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = ${key})
            RETURNING key
          `)
        : await db
            .update(settings)
            .set({ value, updatedAt: now })
            .where(and(eq(settings.key, key), eq(settings.value, expected)))
            .returning({ key: settings.key });
    return rows.length === 1;
  },

  async put(db: Db, key: string, value: string, now: Date): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now } });
  },
};

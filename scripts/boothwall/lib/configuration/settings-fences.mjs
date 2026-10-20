import { readFileSync } from "node:fs";
import { join } from "node:path";

import { API_DIR } from "../paths.mjs";

/** Compare the installed SQLite definitions, not only attacker/stale-controlled trigger names. */
export function settingsFencePredicate() {
  const source = readFileSync(join(API_DIR, "migrations/0010_settings_authority.sql"), "utf8");
  const triggers = source.split("--> statement-breakpoint").map((chunk) => {
    const sql = chunk
      .replace(/^(?:\s|--[^\n]*(?:\n|$))*/, "")
      .trim()
      .replace(/;$/, "");
    const name = /^CREATE TRIGGER (settings_configured_runtime_\w+)\n/.exec(sql)?.[1];
    if (!name) throw Error("Settings authority migration source is invalid");
    return { name, sql };
  });
  if (triggers.length !== 3) throw Error("Settings authority migration source is incomplete");
  return {
    sql: `(SELECT count(*) FROM sqlite_master WHERE type='trigger' AND (${triggers.map(() => "(name=? AND sql=?)").join(" OR ")}))`,
    params: triggers.flatMap(({ name, sql }) => [name, sql]),
  };
}

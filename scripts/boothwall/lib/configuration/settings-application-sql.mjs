import { UserError } from "../ui.mjs";
import { settingsFencePredicate } from "./settings-fences.mjs";
import { sharedConfig } from "./shared-config.mjs";

/** One D1 batch: exact byte comparison, followed by a truthful postcondition/replay read. */
export function applicationQueries(plan, now = Date.now()) {
  const fences = settingsFencePredicate();
  return [
    {
      sql: `UPDATE settings SET value = ?, updated_at = ? WHERE key = 'wall' AND value = ? AND ${fences.sql}=3 RETURNING key`,
      params: [JSON.stringify(plan.record), now, plan.expectedStored, ...fences.params],
    },
    { sql: "SELECT value FROM settings WHERE key = 'wall'", params: [] },
    { sql: `SELECT ${fences.sql} AS installed`, params: fences.params },
  ];
}

export function applicationResult(response, plan) {
  const results = Array.isArray(response) ? response : response?.result;
  if (
    !Array.isArray(results) ||
    results.length !== 3 ||
    results.some((row) => row.success !== true)
  )
    throw new UserError(
      "Migration result is uncertain. Preserve the preview and retry; no success is assumed.",
    );
  if (results[2].results?.[0]?.installed !== 3)
    throw new UserError(
      "Apply migration 0010 and verify its exact authority fences before settings migration.",
    );
  let record;
  try {
    record = JSON.parse(results[1].results[0].value);
  } catch {
    throw new UserError(
      "Stored settings changed or were removed; preserve the backup and regenerate the preview.",
    );
  }
  if (!sharedConfig.matchesSettingsApplication(record, plan.record))
    throw new UserError("A different migration is present; no settings were replaced.");
  return results[0].results?.length === 1 ? "applied" : "already-applied";
}

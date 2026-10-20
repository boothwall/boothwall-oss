import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseJson } from "../cf.mjs";
import {
  applicationQueries,
  applicationResult,
  loadSettingsApplication,
  validateConfiguration,
} from "../configuration/index.mjs";
import { API_DIR } from "../paths.mjs";
import { inspectDeploymentTarget } from "../preflight/index.mjs";
import { assertTargetBinding } from "../resources/index.mjs";
import { UserError } from "../ui.mjs";
import { deploymentAdapter } from "./deployment-adapter.mjs";

/** Operator action only; no automatic config rewrite, backup deletion or authority switch on deploy. */
export async function runSettingsApplication(options, dependencies = {}) {
  const deps = { ...deploymentAdapter, ...dependencies };
  const config = validateConfiguration(await deps.readConfig());
  const plan = await loadSettingsApplication(options, config);
  let id = config.deploy.d1DatabaseId || "00000000-0000-4000-8000-000000000000";
  let runOptions = { cwd: API_DIR, sensitive: true };
  if (!options.local) {
    const target = await inspectDeploymentTarget(config, {
      run: deps.run,
      accountId: options.accountId,
    });
    if (!config.deploy.d1DatabaseId || target.databaseId !== config.deploy.d1DatabaseId)
      throw new UserError("Configured database was not verified; no settings changed.");
    assertTargetBinding(deps.readBinding(), {
      schemaVersion: 1,
      accountId: target.accountId,
      name: config.deploy.name,
    });
    id = target.databaseId;
    runOptions = { ...runOptions, ...target.options };
    deps.log(`Account: ${target.accountId}\nDatabase: ${config.deploy.name} (${id})`);
  } else deps.log(`Local database: ${id}; state: apps/api/.cloudflare/state. No remote fallback.`);
  if (
    !options.yes &&
    !(await deps.confirm("Apply this reviewed settings migration on exactly this database?"))
  )
    throw new UserError("Cancelled. No settings changed.");
  const latest = validateConfiguration(await deps.readConfig());
  if (
    JSON.stringify(latest) !== JSON.stringify(config) ||
    JSON.stringify(await loadSettingsApplication(options, latest)) !== JSON.stringify(plan)
  )
    throw new UserError(
      "Configuration or migration sources changed during confirmation; review and retry.",
    );
  const directory = mkdtempSync(join(tmpdir(), "boothwall-settings-apply-"));
  const request = join(directory, "query.json");
  try {
    writeFileSync(request, JSON.stringify(applicationQueries(plan)), { mode: 0o600, flag: "wx" });
    const args = ["d1", "query", id, "--batch", `@${request}`];
    if (options.local) args.push("--local", "--persist-to", ".cloudflare/state");
    const result = applicationResult(parseJson(await deps.run(args, runOptions)), plan);
    deps.log(
      result === "applied"
        ? "Reviewed settings migration applied; original data and runtime state retained."
        : "The same migration is already applied; current runtime state retained.",
    );
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

import { deployedUrl, parseJson } from "../cf.mjs";
import { deploymentUrls, validateConfiguration } from "../configuration/index.mjs";
import { API_DIR, WEB_DIR } from "../paths.mjs";
import { inspectDeploymentTarget } from "../preflight/index.mjs";
import { assertTargetBinding } from "../resources/index.mjs";
import { UserError } from "../ui.mjs";
import { deploymentAdapter } from "./deployment-adapter.mjs";

async function prepare(options, dependencies, mode) {
  const deps = { ...deploymentAdapter, ...dependencies };
  const target = await inspectDeploymentTarget(await deps.readConfig(), {
    run: deps.run,
    accountId: options.accountId,
  });
  const binding = {
    schemaVersion: 1,
    accountId: target.accountId,
    name: target.config.deploy.name,
  };
  assertTargetBinding(deps.readBinding(), binding);
  if (
    mode !== "setup" &&
    (!target.config.deploy.d1DatabaseId || !target.databaseId || !target.bucketExists)
  )
    throw new UserError(
      "Database or photo bucket is not configured. Run `pnpm boothwall setup` first.",
    );
  deps.log(
    `Account: ${target.accountId}\nDatabase: ${target.config.deploy.name} (${target.databaseId ?? "create"})\nBucket: ${target.bucket} (${target.bucketExists ? "reuse" : "create"})\nWorkers: ${target.config.deploy.name}-api, ${target.config.deploy.name}`,
  );
  deps.log(
    `Domains: ${[target.config.deploy.apiDomain, target.config.deploy.webDomain, ...(target.config.deploy.extraApiDomains ?? [])].filter(Boolean).join(", ") || "workers.dev"}`,
  );
  if (!options.yes && !(await deps.confirm(`Continue ${mode} on exactly this target?`)))
    throw new UserError("Cancelled. No resources changed.");
  // Validate again after a potentially long confirmation prompt.
  if (
    JSON.stringify(validateConfiguration(await deps.readConfig())) !== JSON.stringify(target.config)
  )
    throw new UserError("Configuration changed during setup. Review the target and retry.");
  deps.bindTarget(binding);
  const run = async (args, extra = {}) => {
    if (
      JSON.stringify(validateConfiguration(await deps.readConfig())) !==
      JSON.stringify(target.config)
    )
      throw new UserError("Configuration changed during setup. Review the target and retry.");
    return deps.run(args, { ...target.options, sensitive: true, ...extra });
  };
  const update = async (updates) => {
    if (
      JSON.stringify(validateConfiguration(await deps.readConfig())) !==
      JSON.stringify(target.config)
    )
      throw new UserError("Configuration changed during setup. Review the target and retry.");
    deps.updateConfig(updates);
    for (const [path, value] of updates) {
      if (path === "demo") target.config.demo = value;
      else {
        const [section, key] = path.split(".");
        target.config[section][key] = value;
      }
    }
  };
  return { deps, target, run, update };
}

async function deployWorker(context, type, withSecrets = false) {
  const { target, run } = context;
  const api = type === "api";
  const output = await run(withSecrets ? ["deploy", "--secrets-file", ".dev.vars"] : ["deploy"], {
    cwd: api ? API_DIR : WEB_DIR,
  });
  const url = deployedUrl(
    output,
    api ? target.config.deploy.apiDomain : target.config.deploy.webDomain,
  );
  if (!url)
    throw new UserError(
      `Deployment finished but the ${type} URL was not readable. Inspect your Worker, correct urls.${api ? "api" : "web"}, then rerun setup; existing resources will be reused.`,
    );
  deploymentUrls(url);
  if (!url.startsWith("https://")) throw new UserError("A deployment URL must use HTTPS.");
  return new URL(url).origin;
}

const migrate = ({ target, run }) =>
  run(["d1", "migrations", "apply", target.databaseId, "--dir", "migrations"], { cwd: API_DIR });
function printUrls({ deps, target }) {
  const urls = deploymentUrls(target.config.urls.web);
  deps.log(
    `Display       ${urls.display}\nUpload page   ${urls.snap}\nControl panel ${urls.control}`,
  );
  deps.log(
    "Control passcode: apps/api/.dev.vars (local, gitignored). It is never printed by setup/deploy.",
  );
}

export async function runSetup(options = {}, dependencies = {}) {
  const context = await prepare(options, dependencies, "setup");
  const { deps, target, run, update } = context;
  await deps.ensureSecret();
  if (!target.databaseId) {
    const response = parseJson(await run(["d1", "create", "--name", target.config.deploy.name]));
    const created = response?.result ?? response;
    const id = created?.uuid ?? created?.id;
    if (
      created?.name !== target.config.deploy.name ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id ?? "")
    )
      throw new UserError(
        "Database creation result could not be verified. Keep any created resource; rerun setup to inspect and reuse it.",
      );
    target.databaseId = id;
  }
  await update([["deploy.d1DatabaseId", target.databaseId]]);
  if (!target.bucketExists) await run(["r2", "buckets", "create", "--name", target.bucket]);
  await migrate(context);
  await update([["urls.api", await deployWorker(context, "api", true)]]);
  await update([
    ["urls.web", await deployWorker(context, "web")],
    ["demo", false],
  ]);
  await deployWorker(context, "api");
  await deployWorker(context, "web");
  printUrls(context);
}

export async function runDeploy(options = {}, dependencies = {}) {
  const context = await prepare(options, dependencies, "deploy");
  await migrate(context);
  const api = await deployWorker(context, "api");
  if (api !== context.target.config.urls.api) await context.update([["urls.api", api]]);
  const web = await deployWorker(context, "web");
  if (web !== context.target.config.urls.web) {
    await context.update([["urls.web", web]]);
    await deployWorker(context, "api");
    await deployWorker(context, "web");
  }
  printUrls(context);
}

/** Local migrations are explicit and never fall back to a remote account. */
export async function runMigration(options = {}, dependencies = {}) {
  if (!options.local) {
    const context = await prepare(options, dependencies, "migrate");
    await migrate(context);
    return;
  }
  const deps = { ...deploymentAdapter, ...dependencies };
  const config = validateConfiguration(await deps.readConfig());
  const id = config.deploy.d1DatabaseId || "00000000-0000-4000-8000-000000000000";
  await deps.run(
    [
      "d1",
      "migrations",
      "apply",
      id,
      "--dir",
      "migrations",
      "--local",
      "--persist-to",
      ".cloudflare/state",
    ],
    { cwd: API_DIR, settleMs: 3000 },
  );
}

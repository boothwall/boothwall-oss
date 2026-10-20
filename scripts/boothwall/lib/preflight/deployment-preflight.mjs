import { cf, parseJson } from "../cf.mjs";
import { validateConfiguration } from "../configuration/index.mjs";
import { UserError } from "../ui.mjs";

const fail = (resource) => {
  throw new UserError(
    `Cannot safely inspect ${resource}. No resources changed; check login and permissions.`,
  );
};
const rows = (value, resource) => {
  const result = Array.isArray(value) ? value : value?.result;
  if (!Array.isArray(result)) return fail(resource);
  return result;
};

/** Read-only; returns the account to pin on every subsequent command. */
export async function inspectDeploymentTarget(
  input,
  { run = cf, accountId = process.env.CLOUDFLARE_ACCOUNT_ID } = {},
) {
  const config = validateConfiguration(input);
  const who = parseJson(await run(["auth", "whoami"]));
  if (!who?.authenticated || who.tokenValid === false || !Array.isArray(who.accounts))
    fail("account membership");
  const selected = accountId ?? (who.accounts.length === 1 ? who.accounts[0].id : undefined);
  if (!/^[a-f0-9]{32}$/i.test(selected ?? "") || !who.accounts.some(({ id }) => id === selected))
    throw new UserError(
      "Choose an authenticated target account using CLOUDFLARE_ACCOUNT_ID. No resources changed.",
    );
  const options = { env: { CLOUDFLARE_ACCOUNT_ID: selected } };
  const databases = await inspectDatabases(config.deploy.name, run, options);
  const matching = databases.filter(({ name }) => name === config.deploy.name);
  const databaseId = matching[0]?.uuid ?? matching[0]?.id;
  if (matching.length > 1 || (matching.length && !/^[a-f0-9-]{36}$/i.test(databaseId ?? "")))
    fail("database identity");
  if (config.deploy.d1DatabaseId && config.deploy.d1DatabaseId !== databaseId)
    throw new UserError(
      "Configured database id does not match deploy.name in this account. Keep your data; inspect and explicitly correct the target before retrying.",
    );
  const bucket = `${config.deploy.name}-photos`;
  const bucketExists = await inspectBucket(bucket, run, options);
  await inspectDomains(config.deploy, run, options, selected);
  return {
    config,
    accountId: selected,
    databaseId: databaseId ?? null,
    bucket,
    bucketExists,
    options,
  };
}

async function inspectBucket(name, run, options) {
  const seen = new Set();
  let cursor;
  do {
    const args = ["r2", "buckets", "list", "--name-contains", name, "--per-page", "100"];
    if (cursor) args.push("--cursor", cursor);
    const response = parseJson(await run(args, options));
    const result = response?.result ?? response;
    if (!Array.isArray(result?.buckets)) fail("buckets");
    if (result.buckets.some((bucket) => bucket.name === name)) return true;
    cursor = result.cursor;
    if (cursor && (typeof cursor !== "string" || seen.has(cursor) || seen.size >= 100))
      fail("bucket pagination");
    seen.add(cursor);
  } while (cursor);
  return false;
}

async function inspectDomains(deploy, run, options, accountId) {
  for (const domain of new Set(
    [deploy.apiDomain, deploy.webDomain, ...(deploy.extraApiDomains ?? [])].filter(Boolean),
  )) {
    const labels = domain.split(".");
    let owned = false;
    while (labels.length >= 2 && !owned) {
      const name = labels.join(".");
      const zones = rows(
        parseJson(await run(["zones", "list", "--name", name, "--account-id", accountId], options)),
        "domain zones",
      );
      owned = zones.some(
        (zone) => zone.name?.toLowerCase() === name.toLowerCase() && zone.account?.id === accountId,
      );
      labels.shift();
    }
    if (!owned)
      throw new UserError(
        `Domain ${domain} is not in a verified zone in the target account. No resources changed.`,
      );
  }
}

async function inspectDatabases(name, run, options) {
  const databases = [];
  for (let page = 1; page <= 100; page++) {
    const output = parseJson(
      await run(
        ["d1", "list", "--name", name, "--per-page", "100", "--page", String(page)],
        options,
      ),
    );
    const entries = rows(output, "databases");
    if (entries.some((entry) => !entry || typeof entry.name !== "string"))
      fail("database identity");
    databases.push(...entries);
    if (entries.length < 100) return databases;
  }
  return fail("database pagination");
}

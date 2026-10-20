import { CF, ROOT } from "./paths.mjs";
import { createCfRunner } from "./runner/index.mjs";
import { UserError } from "./ui.mjs";

export const cf = createCfRunner({
  cliPath: CF,
  root: ROOT,
  error: (message) => new UserError(message),
});

/** Parses the first JSON value in cf's output (it can print log lines around it). */
export function parseJson(output) {
  const start = output.search(/[[{]/);
  if (start === -1) return undefined;
  try {
    return JSON.parse(output.slice(start));
  } catch {
    return undefined;
  }
}

export async function ensureLoggedIn() {
  const whoami = parseJson(await cf(["auth", "whoami"]).catch(() => ""));
  if (!whoami?.authenticated) {
    throw new UserError(
      "You're not logged in to Cloudflare. Run `pnpm exec cf auth login`, then try again.",
    );
  }
  return whoami;
}

/** The public URL a deploy printed: the workers.dev address, or the custom domain we set. */
export function deployedUrl(output, customDomain) {
  if (customDomain) return `https://${customDomain}`;
  return output.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i)?.[0];
}

/**
 * Whether a D1 database id belongs to the logged-in account. A config copied from another
 * deployment names resources this account can't use.
 */
export async function databaseInAccount(id) {
  const listed = parseJson(await cf(["d1", "list"]));
  const rows = Array.isArray(listed) ? listed : (listed?.result ?? []);
  return rows.some((row) => (row?.uuid ?? row?.id) === id);
}

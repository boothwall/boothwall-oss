import { cpSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { EXAMPLES_DIR, ROOT } from "../lib/paths.mjs";
import { confirm, dim, log, ok, step, UserError } from "../lib/ui.mjs";

const COPIED = ["apps", "packages"];

const available = () =>
  readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

/**
 * An example's files whose folder the repo doesn't have, relative to the example. Copying one
 * would add a stray folder that nothing reads (and `git checkout` doesn't remove) instead of
 * replacing the repo's file.
 */
export function strayFiles(dir, root = ROOT) {
  return COPIED.filter((folder) => existsSync(join(dir, folder)))
    .flatMap((folder) =>
      readdirSync(join(dir, folder), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(dir, join(entry.parentPath, entry.name))),
    )
    .filter((file) => !existsSync(dirname(join(root, file))))
    .sort();
}

/** Copies an example's config and brand files over the repo (they mirror its layout). */
export async function applyExample(name, { yes = false } = {}) {
  if (!name) {
    log(`Examples: ${available().join(", ")}`);
    log(dim("Apply one with `pnpm boothwall example <name>`."));
    return;
  }
  const dir = join(EXAMPLES_DIR, name);
  if (!existsSync(dir))
    throw new UserError(`No example "${name}". Available: ${available().join(", ")}`);
  const stray = strayFiles(dir);
  if (stray.length)
    throw new UserError(
      `Example "${name}" has files for folders this repo doesn't have: ${stray.join(", ")}. Nothing changed.`,
    );

  step(`Applying example "${name}"`);
  log(dim("  This overwrites boothwall.config.ts and the brand images with the example's."));
  if (!yes && !(await confirm("  Continue?"))) throw new UserError("Nothing changed.");
  for (const folder of COPIED) {
    if (existsSync(join(dir, folder)))
      cpSync(join(dir, folder), join(ROOT, folder), { recursive: true });
  }
  ok("Done. `git diff` shows what changed; `git checkout -- apps packages` undoes it.");
}

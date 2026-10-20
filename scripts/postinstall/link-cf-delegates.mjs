// The cf CLI (beta) only looks for @cloudflare/vite-plugin in the app's own node_modules,
// but a hoisted install puts it at the workspace root. Link it into every workspace app that
// depends on it. Works for the core on its own and for a workspace that contains it.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN = "@cloudflare/vite-plugin";

/** The nearest folder above this script that has a pnpm-workspace.yaml. */
function workspaceRoot() {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return dir;
}

/** The workspace's package folders: each `packages:` line, with one `*` expanded. */
function projectDirs(root) {
  const block = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8").match(
    /^packages:\n((?:\s+-[^\n]*\n?)+)/m,
  );
  const patterns = (block?.[1] ?? "")
    .split("\n")
    .map((line) => line.match(/^\s*-\s*["']?([^"'#\s]+)/)?.[1])
    .filter(Boolean);
  return patterns.flatMap((pattern) => {
    if (!pattern.endsWith("/*")) return [join(root, pattern)];
    const parent = join(root, pattern.slice(0, -2));
    if (!existsSync(parent)) return [];
    return readdirSync(parent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(parent, entry.name));
  });
}

function dependsOnPlugin(dir) {
  const manifest = join(dir, "package.json");
  if (!existsSync(manifest)) return false;
  const { dependencies = {}, devDependencies = {} } = JSON.parse(readFileSync(manifest, "utf8"));
  return PLUGIN in dependencies || PLUGIN in devDependencies;
}

const root = workspaceRoot();
const source = root && join(root, "node_modules", PLUGIN);
if (root && existsSync(source)) {
  for (const dir of projectDirs(root).filter(dependsOnPlugin)) {
    const target = join(dir, "node_modules", PLUGIN);
    mkdirSync(dirname(target), { recursive: true });
    rmSync(target, { recursive: true, force: true });
    symlinkSync(relative(dirname(target), source), target);
  }
}

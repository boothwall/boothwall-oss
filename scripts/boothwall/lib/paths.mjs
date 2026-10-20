import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute paths the CLI works with, independent of where it's run from. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const CONFIG_FILE = join(ROOT, "packages/shared/src/config/boothwall.config.ts");
export const API_DIR = join(ROOT, "apps/api");
export const WEB_DIR = join(ROOT, "apps/web");
export const TV_DIR = join(ROOT, "apps/tv-vega");
export const EXAMPLES_DIR = join(ROOT, "examples");
export const DEV_VARS = join(API_DIR, ".dev.vars");
export const DEMO_PHOTOS_DIR = join(ROOT, "packages/wall-ui/src/assets/demo");
export const DEMO_PHOTOS_LIST = join(ROOT, "packages/wall-ui/src/features/wall/data/demoPhotos.ts");

/** A tool from the nearest node_modules/.bin at or above the core (a parent workspace hoists it). */
function binary(name) {
  for (let dir = ROOT; ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules/.bin", name);
    if (existsSync(candidate)) return candidate;
    if (existsSync(join(dir, "pnpm-workspace.yaml")) || dirname(dir) === dir)
      throw new Error(`${name} is not installed. Run pnpm install first.`);
  }
}

export const CF = binary("cf");
export const VITE = binary("vite");

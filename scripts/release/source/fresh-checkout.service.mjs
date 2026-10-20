import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function assertFreshCheckout(directory) {
  for (const name of readdirSync(directory)) {
    if (name === ".git") continue;
    if (["node_modules", ".cloudflare", ".turbo"].includes(name))
      throw new Error("Fresh dependency/cache-free checkout required");
    const path = join(directory, name),
      stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error("Fresh checkout cannot contain symbolic entries");
    if (stat.isDirectory()) assertFreshCheckout(path);
  }
}

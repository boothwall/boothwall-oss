import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, type Plugin } from "vite";

const SHARED_CONFIG = fileURLToPath(
  new URL("../../packages/shared/src/config/boothwall.config.ts", import.meta.url),
);

/**
 * `cf dev` blocks the dev server from reading any file cloudflare.config.ts imports. The Worker
 * imports boothwall.config.ts too (through @boothwall/shared), so load that one file for the
 * Worker here. Browser requests for it stay blocked, and editing it still restarts the server.
 */
function sharedConfig(): Plugin {
  return {
    name: "boothwall:shared-config",
    enforce: "pre",
    load(id) {
      if (id !== SHARED_CONFIG || this.environment.name === "client") return undefined;
      return readFile(id, "utf8");
    },
  };
}

export default defineConfig({
  // `pnpm demo --lan`: Vite's own CORS admits only localhost, so the Worker's rules decide instead.
  server: process.env.BOOTHWALL_DEMO_LAN ? { host: "0.0.0.0", cors: false } : {},
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [sharedConfig(), cloudflare()],
});

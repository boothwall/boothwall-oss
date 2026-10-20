import { networkInterfaces } from "node:os";

import { boothwallConfig } from "@boothwall/shared/config/boothwall.config";
import { bindings, defineConfig, exports, triggers } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

const { deploy, urls, retentionDays } = boothwallConfig;
const WORKER_NAME = `${deploy.name}-api`;
// Stand-in D1 id for local dev before `pnpm boothwall setup` creates the real database.
// Keep in sync with scripts/boothwall/commands/migrate.mjs.
const LOCAL_D1_ID = "00000000-0000-4000-8000-000000000000";
// Phones on the same network use the local web app at this machine's address (`pnpm demo --lan`).
// Browsers send an origin without a path, so a web app served under one still matches.
const webOrigin = new URL(urls.web).origin;
const lanOrigins = () =>
  Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry?.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry?.address}:*`);
/**
 * Browser pages that may call the API and show its images. Locally any port, so a dev server
 * that moved off 5173 still works; deployed, the web app and a local web app on 5173.
 */
const allowedOrigins = (mode: string | undefined) =>
  mode === "development"
    ? [webOrigin, "http://localhost:*", "http://127.0.0.1:*", ...lanOrigins()].join(",")
    : `${webOrigin},http://localhost:5173`;

/** The API Worker. Names and ids come from the `deploy` section of boothwall.config.ts. */
export default defineConfig({
  worker: ({ mode }) => ({
    name: WORKER_NAME,
    compatibilityDate: "2026-09-25",
    entrypoint,
    ...(deploy.apiDomain
      ? { domains: [deploy.apiDomain, ...(deploy.extraApiDomains ?? [])] }
      : { workersDev: true }),
    env: {
      DB: bindings.d1({ id: deploy.d1DatabaseId || LOCAL_D1_ID, name: deploy.name }),
      PHOTOS: bindings.r2({ name: `${deploy.name}-photos` }),
      WALL: bindings.durableObject({ worker: WORKER_NAME, exportName: "WallRoom" }),
      ADMIN_TOKEN: bindings.secret(),
      CLIENT_FINGERPRINT_KEY: bindings.secret(),
      ALLOWED_ORIGINS: bindings.text(allowedOrigins(mode)),
      RETENTION_DAYS: bindings.text(String(retentionDays)),
    },
    exports: {
      WallRoom: exports.durableObject({ storage: "sqlite" }),
    },
    // Nightly purge of photos past the retention window (GDPR: data minimisation).
    triggers: [triggers.scheduled({ schedule: "17 3 * * *" })],
    observability: { enabled: true },
  }),
});

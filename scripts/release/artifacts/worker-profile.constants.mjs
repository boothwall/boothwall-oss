import { freeze } from "../core/index.mjs";

export const workerProfiles = freeze({
  api: {
    name: "boothwall-api",
    compatibilityDate: "2026-09-25",
    triggers: [{ type: "scheduled", schedule: "17 3 * * *" }],
    observability: { enabled: true },
    workersDev: true,
    env: {
      DB: { type: "d1", name: "boothwall", id: "00000000-0000-4000-8000-000000000000" },
      PHOTOS: { type: "r2", name: "boothwall-photos" },
      WALL: { type: "durable-object", worker: "boothwall-api", exportName: "WallRoom" },
      ADMIN_TOKEN: { type: "secret" },
      CLIENT_FINGERPRINT_KEY: { type: "secret" },
      ALLOWED_ORIGINS: { type: "text", value: "https://wall.example.com,http://localhost:5173" },
      RETENTION_DAYS: { type: "text", value: "14" },
    },
    exports: { WallRoom: { type: "durable-object", storage: "sqlite" } },
    manifest: { type: "partial", mainModule: "index.js", modules: {} },
  },
  web: {
    name: "boothwall",
    compatibilityDate: "2026-09-25",
    assets: { notFoundHandling: "single-page-application" },
    workersDev: true,
  },
});
export const outputPath = (app) => `apps/${app}/.cloudflare/output/v0/workers/default`;
export const legacyNativeEvidence = freeze([
  {
    platform: "android",
    status: "not-built",
    reason: "Separate pinned SDK, signing and artifact evidence required",
  },
  {
    platform: "vega",
    status: "not-built",
    reason: "Separate vendor SDK, signing and artifact evidence required",
  },
]);

export const nativeEvidence = freeze([legacyNativeEvidence[1]]);

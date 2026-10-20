import { boothwallConfig } from "@boothwall/shared/config/boothwall.config";
import { defineConfig } from "cf/config";

const { deploy } = boothwallConfig;

/** Static SPA (no server code): the web wall, the upload page and the booth's Control panel. */
export default defineConfig({
  worker: {
    name: deploy.name,
    compatibilityDate: "2026-09-25",
    ...(deploy.webDomain ? { domains: [deploy.webDomain] } : { workersDev: true }),
    assets: { notFoundHandling: "single-page-application" },
  },
});

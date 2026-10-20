import type { LocalApi } from "./localApi.types";

/**
 * Where a local API overrides boothwall.config.ts. The TV has no environment to read, so it
 * always uses the config; the web twin (localApi.web.ts) follows the web app's `VITE_API_URL`.
 */
export const LOCAL_API: LocalApi | null = null;

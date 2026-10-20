import type { LocalApi } from "./localApi.types";

// The web app's Vite environment; this package has no Vite types of its own.
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const location = (globalThis as { location?: { origin: string } }).location;

/**
 * With `VITE_API_URL` set (`pnpm demo`, or a local API by hand), the wall in the browser talks to
 * that API too, and its QR code points at this web app (under its base path) instead of the
 * deployed one.
 */
export const LOCAL_API: LocalApi | null =
  env?.VITE_API_URL && location
    ? {
        apiBaseUrl: env.VITE_API_URL,
        webUrl: `${location.origin}${(env.BASE_URL ?? "/").replace(/\/$/, "")}`,
      }
    : null;

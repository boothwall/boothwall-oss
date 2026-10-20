import { type BoothwallConfig, boothwallConfig, EVENT } from "@boothwall/shared";

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? boothwallConfig.urls.api,
  retentionDays: boothwallConfig.retentionDays,
  venue: EVENT.venue,
  /** The wall's look; the shared wall stays classic unless this app passes it. */
  wallLook: (boothwallConfig as BoothwallConfig).wall,
} as const;

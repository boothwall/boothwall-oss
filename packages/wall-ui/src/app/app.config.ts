import {
  type BoothwallConfig,
  boothwallConfig,
  DEFAULT_WALL_ID,
  type WallTarget,
} from "@boothwall/shared";

import { LOCAL_API } from "../platform/config/localApi";

export type AppConfig = {
  apiBaseUrl: string;
  /** The upload page that the on-screen QR code points to. */
  joinUrl: string;
  /** Upper case so QR alphanumeric mode keeps the tiny badge code scannable. */
  sourceUrl: string;
  requestTimeoutMs: number;
  simulation: { enabled: boolean; newPhotoEveryMs: number };
  /** The TV build's one wall and optional display credential, from `tv` in boothwall.config.ts. */
  wallTarget: WallTarget;
};

const { urls, tv } = boothwallConfig as BoothwallConfig;
const webUrl = LOCAL_API?.webUrl ?? urls.web;

/**
 * A deployed web app redirects /gh to the repo, and the short upper-case URL keeps the QR coarse.
 * A local one (http, e.g. `pnpm demo --lan`) can't, so the QR points at the repo itself.
 */
export const sourceUrlFor = ({ web, source }: Pick<BoothwallConfig["urls"], "web" | "source">) =>
  web.startsWith("https://") ? `${web}/GH`.toUpperCase() : source;

export const appConfig: AppConfig = {
  apiBaseUrl: LOCAL_API?.apiBaseUrl ?? urls.api,
  joinUrl: `${webUrl}/snap`,
  sourceUrl: sourceUrlFor(urls),
  requestTimeoutMs: 8000,
  // Demo mode (boothwall.config.ts) runs the wall on the bundled demo photos, without the API.
  simulation: { enabled: boothwallConfig.demo, newPhotoEveryMs: 15_000 },
  wallTarget: {
    wallId: tv?.wallId ?? DEFAULT_WALL_ID,
    ...(tv?.displayCredential && { screenToken: tv.displayCredential }),
  },
};

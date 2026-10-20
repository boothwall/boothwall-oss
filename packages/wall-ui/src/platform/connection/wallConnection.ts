import {
  BADGE_LABEL,
  type BoothwallConfig,
  boothwallConfig,
  DEFAULT_SETTINGS,
  SOURCE_CREDITS,
  type WallConnection,
  type WallTarget,
} from "@boothwall/shared";
import { createContext, useContext } from "react";

import { appConfig } from "#app/config";

/**
 * The build's own wall: `tv` in boothwall.config.ts, else the open edition's one wall. It has no
 * recap page, so an ended event shows the thank-you without a QR; a host passes its own recapUrl.
 */
export function defaultWallConnection(target: WallTarget = appConfig.wallTarget): WallConnection {
  return {
    apiBaseUrl: appConfig.apiBaseUrl,
    target,
    joinUrl: appConfig.joinUrl,
    sourceUrl: appConfig.sourceUrl,
    sourceLabel: boothwallConfig.author.handle,
    showSource: SOURCE_CREDITS.wall,
    badge: BADGE_LABEL,
    venue: (boothwallConfig as BoothwallConfig).event.venue,
    storageNamespace: JSON.stringify([appConfig.apiBaseUrl.replace(/\/+$/, ""), target.wallId]),
    initialSettings: DEFAULT_SETTINGS,
  };
}
export const WallConnectionContext = createContext<WallConnection | null>(null);
const fallback = defaultWallConnection();
export const useWallConnection = () => useContext(WallConnectionContext) ?? fallback;

import type { EventRuntime } from "@boothwall/event-ui/runtime";
import {
  type BoothwallConfig,
  boothwallConfig,
  DEFAULT_SETTINGS,
  DEFAULT_WALL_TARGET,
  SOURCE_CREDITS,
} from "@boothwall/shared";

import logo from "@/assets/brand/logo.png";
import {
  appConfig,
  appPath,
  CONTROL_PATH,
  EVENT_WORDMARK,
  GUEST_CREDIT,
  LOCKUP_NAME,
  SNAP_PATH,
  WALL_PATH,
} from "@/config";

import { createStandaloneEventTransport } from "./standalone-event.transport";
export function createStandaloneEventRuntime(
  getPasscode: () => string,
  audience: "public" | "control" = "public",
): EventRuntime {
  return {
    scopeKey: JSON.stringify([
      new URL(appConfig.apiBaseUrl).origin,
      DEFAULT_WALL_TARGET.wallId,
      audience,
      boothwallConfig.demo,
    ]),
    transport: createStandaloneEventTransport({ apiBaseUrl: appConfig.apiBaseUrl, getPasscode }),
    links: {
      wall: appPath(WALL_PATH),
      snap: appPath(SNAP_PATH),
      control: appPath(CONTROL_PATH),
    },
    wall: { target: DEFAULT_WALL_TARGET, apiBaseUrl: appConfig.apiBaseUrl },
    defaults: DEFAULT_SETTINGS,
    // With an event wordmark, the lockup leads and the wordmark is the event's logo beside it.
    ...(EVENT_WORDMARK && { hostLogo: { src: logo, alt: `${LOCKUP_NAME}, back to the wall` } }),
    presentation: {
      logoUrl: EVENT_WORDMARK ?? logo,
      sourceUrl: boothwallConfig.urls.source,
      sourceLabel: boothwallConfig.author.handle,
      guestSourceLabel: GUEST_CREDIT,
      showSourceOnGuest: SOURCE_CREDITS.guest,
      showSourceOnWall: SOURCE_CREDITS.wall,
      badge: (boothwallConfig as BoothwallConfig).badge,
      venue: (boothwallConfig as BoothwallConfig).event.venue,
      notice: (boothwallConfig as BoothwallConfig).notice,
    },
    retentionDays: appConfig.retentionDays,
    demo: boothwallConfig.demo,
    // The browser wall answers Control's "Photo call" and "Remote help" itself, like the TV app.
    wallMoments: { photoCall: true, remoteHelp: true },
  };
}

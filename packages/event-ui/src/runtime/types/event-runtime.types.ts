import type { EventPresentation, WallSettings, WallTarget } from "@boothwall/shared";

import type { EventApiError } from "../errors";

export type EventAccess = "public" | "control";
export type EventRequestOptions = RequestInit & { access: EventAccess };
export interface EventTransport {
  request(path: string, options: EventRequestOptions): Promise<Response>;
  socketUrl(kind: "public" | "control", ticket?: string): string;
}
export interface EventLinks {
  wall: string;
  snap: string;
  recap?: string;
  control: string;
}
export interface EventRuntime {
  scopeKey: string;
  transport: EventTransport;
  links: EventLinks;
  wall: { target: WallTarget; apiBaseUrl: string };
  defaults: WallSettings;
  presentation: EventPresentation & {
    sourceUrl: string;
    sourceLabel: string;
    /** The source link's words under the guest pages, when they differ from `sourceLabel`. */
    guestSourceLabel?: string;
    showSourceOnWall: boolean;
    showSourceOnGuest: boolean;
    badge?: string;
    venue?: string;
    /** One quiet line under the guest pages and on Control, like a demo's ground rules. */
    notice?: string;
    /** Lines of the wall a host words its own way; the wall's own words without. */
    wallWords?: { accessChanged?: string };
  };
  /**
   * The app's own lockup, for guest pages with two brands in one bar: it leads on the left, with
   * `alt` naming where it goes, and the event's logo sits on the right. Absent, or without an
   * event logo, the event's logo leads alone.
   */
  hostLogo?: { src: string; alt: string };
  retentionDays: number;
  /** Optional server promise; absent preserves the standalone operator's configuration. */
  retention?: {
    observedAt: string;
    anchor: "scheduled-event-end" | "upload";
    days: number;
    expiresAt: string | null;
  } | null;
  demo: boolean;
  /**
   * The host-phone requests the browser wall answers itself, as the TV app does: a photo call
   * and the remote's help card. Absent, the browser wall leaves both to a TV app.
   */
  wallMoments?: { photoCall: boolean; remoteHelp: boolean };
}
export interface ControlAccess {
  ready: boolean;
  onAccessError(error: EventApiError): boolean;
}

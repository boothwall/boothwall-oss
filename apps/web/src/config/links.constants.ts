import { boothwallConfig } from "@boothwall/shared";

export const REPO_URL = boothwallConfig.urls.source;
export const AUTHOR_HANDLE = boothwallConfig.author.handle;

/** Where the app is served: "/", or a path such as "/demo/" when `urls.web` has one. */
export const APP_BASE: string = import.meta.env.BASE_URL;

/** A route ("/", "/snap") as an address on this site, under the app's base path. */
export const appPath = (route: string, base = APP_BASE) => `${base}${route.replace(/^\//, "")}`;

/** The wall itself, in a browser: the web app's root. */
export const WALL_PATH = "/";
/** The upload page; the TV's QR code points here. */
export const SNAP_PATH = "/snap";
/** Control; on a phone its Review tab, with Live and Guests beside it. */
export const CONTROL_PATH = "/control";
export const CONTROL_LIVE_PATH = "/control/live";
export const CONTROL_GUESTS_PATH = "/control/guests";

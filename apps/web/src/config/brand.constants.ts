import { boothwallConfig, EVENT } from "@boothwall/shared";

import { appPath } from "./links.constants";

/** What the bundled lockup (assets/brand/logo.png) says; change it with the image. */
export const LOCKUP_NAME = "BoothWall OSS";

/**
 * The event's wordmark right of the lockup on the phone pages (`event.wordmark`, a file in
 * public/), under the app's base path; none when the config leaves it out.
 */
export const EVENT_WORDMARK: string | undefined = EVENT.wordmark
  ? appPath(EVENT.wordmark)
  : undefined;

/** The credit under the guest pages: the edition, its licence and where its source lives. */
export const GUEST_CREDIT = `${LOCKUP_NAME} · MIT · source${
  new URL(boothwallConfig.urls.source).hostname === "github.com" ? " on GitHub" : ""
}`;

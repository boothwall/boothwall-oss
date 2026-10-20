import type { FeedStatus } from "@boothwall/wall-ui";

/** The wall shows photos: from the live feed, or the bundled ones in demo mode. */
export const isFeedShowing = (status: FeedStatus) => status === "live" || status === "simulated";

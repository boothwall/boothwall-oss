import type { FeedStatus } from "@boothwall/wall-ui";

import { isFeedShowing } from "@/platform/wall-status";

type VegaGlobal = { performance?: { reportFullyDrawn?: () => void } };

let reported = false;

/** Vega's time-to-fully-drawn mark: once, when the wall first shows its feed (live or demo). */
export function reportFullyDrawnOnce(status: FeedStatus) {
  if (reported || !isFeedShowing(status)) return;
  reported = true;
  (globalThis as VegaGlobal).performance?.reportFullyDrawn?.();
}

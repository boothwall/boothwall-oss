/** Bump when the cached shape changes: older entries are then ignored, never misread. */
export const CACHE_VERSION = 1;
export const CACHE_KEY_PREFIX = "boothwall.wall-cache";
/** Coalesces a burst of events (a page of approvals) into one write. */
export const SAVE_DEBOUNCE_MS = 3_000;

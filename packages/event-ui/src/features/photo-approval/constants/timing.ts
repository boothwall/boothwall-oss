/** How often to look for the photo on the wall, in case the realtime socket can't connect. */
export const APPROVAL_POLL_MS = 5000;
/**
 * After this long without approval the photo is waiting for a person, not for the smart check
 * (which answers within seconds), and the page can say so.
 */
export const APPROVAL_SLOW_MS = 15_000;
/** Nobody approved it in this time: stop watching. The guest can still look at the screen. */
export const APPROVAL_GIVE_UP_MS = 15 * 60_000;
/** How many of the newest wall photos a poll checks. */
export const APPROVAL_POLL_LIMIT = 50;

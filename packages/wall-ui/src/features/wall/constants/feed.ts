/** Maximum live pool; demo mode supplies its own smaller snapshot. */
export const POOL_LIMIT = 80;
/** Without a socket within this window, load the first snapshot over HTTP instead of waiting. */
export const EARLY_SNAPSHOT_MS = 1_500;
/** Socket keepalive; the server answers each ping with a pong. */
export const PING_MS = 25_000;
/** Nothing heard for this long (two missed pongs, or a wake from sleep): treat the socket as dead. */
export const SILENT_SOCKET_MS = PING_MS * 2 + 5_000;
/** Ceiling for the reconnect and snapshot retry backoff. */
export const MAX_BACKOFF_MS = 15_000;

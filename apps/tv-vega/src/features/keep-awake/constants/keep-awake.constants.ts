/**
 * How long after launch the silent player starts. Its media pipeline takes a few hundred ms of
 * the Stick's media services and JS thread; the screensaver is minutes away, so the wall's first
 * fetch and render go first.
 */
export const KEEP_AWAKE_START_MS = 5000;

/**
 * If the playhead has not moved for this long while the wall wants audio, the playback session
 * has died without an `ended` event. Restart before the default 5-minute screensaver.
 */
export const KEEP_AWAKE_STALL_MS = 60_000;

/** Ignore a second rewind this soon after the last, so a player that re-fires `ended` cannot spin. */
export const KEEP_AWAKE_REWIND_MIN_MS = 1000;

/**
 * LCM inactivity timeout for the foreground component, in seconds. Omitted from the manifest,
 * this is the system default, and on timeout the component is sent to the background with no
 * crash report. One year is the longest a signage wall asks for; `lifespan = "permanent"` is
 * the same request in the manifest.
 */
export const KEEP_AWAKE_TIMEOUT_SECS = 60 * 60 * 24 * 365;

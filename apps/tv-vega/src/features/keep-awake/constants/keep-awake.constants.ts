/**
 * How long after launch the silent player starts. Its media pipeline takes a few hundred ms of
 * the Stick's media services and JS thread; the screensaver is minutes away, so the wall's first
 * fetch and render go first.
 */
export const KEEP_AWAKE_START_MS = 5000;

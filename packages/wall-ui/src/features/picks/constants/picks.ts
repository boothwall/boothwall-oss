/** When the wall opens a pick on its own (the `showPicks` setting). */
export const PICK_TIMING = {
  /** The first pick, once the wall has had a moment to fill up. */
  firstAfterMs: 60_000,
  /** Then one every few minutes: a moment, not a second slideshow. */
  everyMs: 180_000,
  /** The wall was busy (a photo open full screen, an arrival, paused): look again this soon. */
  retryMs: 15_000,
  /** How long a pick stays up. */
  showMs: 9_000,
} as const;

/** What it takes to be picked. */
export const PICK_RULES = {
  /** A crowd favourite has at least this many reactions. */
  minReactions: 3,
  /** An AI pick scored at least this on the smart check's highlight score (0 to 1). */
  minHighlight: 0.6,
  /** A photo isn't picked again until this many others have been. */
  rememberLast: 6,
} as const;

/** How long the card stays without a key press; the countdown line runs out over it. */
export const REMOTE_HINT_MS = 10_000;

/** The card fades in as fast as the TV's other flashes. */
export const REMOTE_HINT_FADE_IN_MS = 180;

/** A glyph on one key cap. */
export type KeyGlyphName = "ok" | "left" | "right" | "playPause" | "menu" | "back";

/** What a row shows in its key column: one cap, OK held, or the two arrows. */
export type HintKeys = "ok" | "holdOk" | "arrows" | "playPause" | "menu" | "back";

export interface HintRow {
  keys: HintKeys;
  label: string;
  /** Said after the label, quieter. */
  note?: string;
}

export const remoteHintCopy = {
  title: "Remote",
  ok: "OK",
  hold: "hold",
  or: "or",
  closes: "closes",
  close: "Close the remote help",
} as const;

/** Every button the wall answers to, as it behaves in this mode and state. */
export function remoteHintRows({ demo, paused }: { demo: boolean; paused: boolean }): HintRow[] {
  return [
    { keys: "ok", label: "Open a photo full screen" },
    { keys: "holdOk", label: "Start or end a photo call" },
    { keys: "arrows", label: "Previous or next photo" },
    { keys: "playPause", label: paused ? "Resume the slideshow" : "Pause the slideshow" },
    { keys: "menu", label: demo ? "Themes" : "Show or hide this help" },
    { keys: "back", label: "Close a photo", note: "· twice to exit" },
  ];
}

/** The keys the footer names as closing the card; in demo mode Menu means the next theme. */
export const closingKeys = (demo: boolean): KeyGlyphName[] => (demo ? ["back"] : ["back", "menu"]);

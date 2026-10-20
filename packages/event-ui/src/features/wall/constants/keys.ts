import type { RemoteCommand } from "@boothwall/shared";

/** Keyboard stand-ins for the Fire TV remote, by `KeyboardEvent.key`. */
export const KEY_COMMANDS: Record<string, RemoteCommand> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "select",
  " ": "playpause",
  Escape: "back",
  Backspace: "back",
};

/** Elements that keep their own keys, so a key typed into them never drives the wall. */
export const INTERACTIVE_SELECTOR = "a[href], button, input, select, textarea, [contenteditable]";

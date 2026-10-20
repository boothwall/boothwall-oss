import { type HWEvent, useTVEventHandler } from "@amazon-devices/react-native-kepler";
import type { RemoteHandlers, RemoteKey } from "@boothwall/wall-ui";
import { useRef } from "react";

const KEY_DOWN = 0;
/** Holding OK this long makes a long press; Vega repeats the key down meanwhile. */
export const LONG_PRESS_MS = 600;
/** A key down this long after the last one starts a new press: the old key up never came. */
export const STALE_HOLD_MS = 1000;

/** Remotes name the same buttons differently; normalise to what the wall understands. */
const ALIASES: Record<string, RemoteKey> = {
  enter: "select",
  center: "select",
  play_pause: "playpause",
};

/** The remote's buttons, as an overlay that owns the remote hears them; other events don't count. */
const BUTTONS = new Set<string>([
  ...["select", "back", "menu", "left", "right", "up", "down", "playpause"],
  ...["rewind", "forward", "skip_backward", "skip_forward"],
]);

/** Keys outside the wall's own handlers, for an app that adds its own moments. */
export interface RemoteExtras {
  /** An overlay owns the remote: every press goes here, and nothing else fires. */
  onCaptured?: () => void;
  onLongSelect?: () => void;
  onMenu?: () => void;
}

/** The Fire TV remote. Fires once per press: on key up, or right away for keys that report no state. */
export function useVegaRemote(handlers: RemoteHandlers, extras: RemoteExtras = {}) {
  const selectDownAt = useRef<number | null>(null);
  const lastSelectDown = useRef(0);
  useTVEventHandler((event: HWEvent) => {
    const key: string = ALIASES[event.eventType] ?? event.eventType;
    if (event.eventKeyAction === KEY_DOWN) {
      if (key !== "select") return;
      const now = Date.now();
      if (selectDownAt.current === null || now - lastSelectDown.current > STALE_HOLD_MS)
        selectDownAt.current = now;
      lastSelectDown.current = now;
      return;
    }
    let heldMs = 0;
    if (key === "select") {
      heldMs = selectDownAt.current === null ? 0 : Date.now() - selectDownAt.current;
      selectDownAt.current = null;
    }
    if (extras.onCaptured) {
      if (BUTTONS.has(key)) extras.onCaptured();
      return;
    }
    if (extras.onLongSelect && heldMs >= LONG_PRESS_MS) return extras.onLongSelect();
    if (key === "menu" && extras.onMenu) return extras.onMenu();
    handlers[key as RemoteKey]?.();
  });
}

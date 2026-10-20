import { useEffect } from "react";

import { INTERACTIVE_SELECTOR, KEY_COMMANDS } from "#features/wall/constants";

import { isFullscreenEscape } from "./useFullscreen";
import type { WallMomentsState } from "./useWallMoments";

/**
 * The keyboard while a moment has the wall, ahead of the wall's own keys, as the TV routes its
 * remote: any key closes the help card and does nothing else; during a photo call Escape or
 * Backspace ends it and the wall's other keys wait. Keys the wall doesn't use (F for full
 * screen) still work during a call.
 */
export function useMomentInput(moments: WallMomentsState | null) {
  const hintOpen = moments?.hint.open ?? false;
  const callOpen = (moments?.photoCall.call ?? null) !== null;
  const hideHint = moments?.hint.hide;
  const endCall = moments?.photoCall.close;

  useEffect(() => {
    if (!hintOpen && !callOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || MODIFIERS.has(event.key)) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;
      const command = KEY_COMMANDS[event.key];
      if (hintOpen) hideHint?.();
      else if (!command) return;
      else if (command === "back") {
        // The Escape that leaves full screen is the browser's (see useKeyboardRemote).
        if (event.key === "Escape" && isFullscreenEscape()) return;
        endCall?.();
      }
      event.preventDefault();
      event.stopPropagation();
    };
    // Capture on window runs before every other key listener on the page.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [callOpen, endCall, hideHint, hintOpen]);
}

const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);

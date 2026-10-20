import type { WallInputState } from "@/features/wall-input";

export interface MediaCommands {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
}

/**
 * The wall only exposes a play/pause toggle, so play and pause check its reported state first.
 * While an overlay owns the remote, a command only reaches the overlay.
 */
export function mediaCommandsFor(state: WallInputState): MediaCommands {
  const routed = (command: () => void) => () => (state.onCaptured ? state.onCaptured() : command());
  const toggle = () => state.handlers?.playpause?.();
  return {
    play: routed(() => {
      if (state.paused) toggle();
    }),
    pause: routed(() => {
      if (!state.paused) toggle();
    }),
    toggle: routed(toggle),
    next: routed(() => state.handlers?.right?.()),
    previous: routed(() => state.handlers?.left?.()),
  };
}

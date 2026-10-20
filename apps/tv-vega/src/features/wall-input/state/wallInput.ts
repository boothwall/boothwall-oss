import type { RemoteHandlers } from "@boothwall/wall-ui";

export interface WallInputState {
  handlers: RemoteHandlers | null;
  paused: boolean;
  /** An overlay that takes every press, media commands included (see WallInputRouting). */
  onCaptured: (() => void) | null;
}

// One singleton component shows one wall, so one input state serves it. Media commands arrive
// outside React, so they read it here.
export const wallInput: WallInputState = { handlers: null, paused: false, onCaptured: null };

export function onWallPausedChange(paused: boolean) {
  wallInput.paused = paused;
}

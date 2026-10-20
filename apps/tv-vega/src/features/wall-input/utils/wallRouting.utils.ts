import type { WallInputRouting } from "@/features/wall-input/state/WallInputContext";

export interface WallMoments {
  demo: boolean;
  /** A photo call has the screen; a held OK ends it. */
  callOpen: boolean;
  toggleCall: () => void;
  /** The remote help card has the screen; any key closes it. */
  hintOpen: boolean;
  showHint: () => void;
  hideHint: () => void;
  /** Demo mode: Menu steps through the themes instead of opening the help. */
  nextTheme?: () => void;
}

/** Who gets the remote: the help card while it's open, then a photo call, then the wall. */
export function wallRouting(moments: WallMoments): WallInputRouting {
  const { demo, callOpen, hintOpen } = moments;
  return {
    captured: callOpen || hintOpen,
    onCaptured: hintOpen ? moments.hideHint : undefined,
    onLongSelect: moments.toggleCall,
    onMenu: demo ? moments.nextTheme : moments.showHint,
  };
}

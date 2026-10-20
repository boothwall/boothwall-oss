import { createContext } from "react";

export interface WallInputRouting {
  /** An overlay owns the remote: the wall underneath gets no keys. */
  captured: boolean;
  /** Takes every press while set, media commands included, and nothing else fires. */
  onCaptured?: () => void;
  onLongSelect?: () => void;
  onMenu?: () => void;
}

export const WallInputContext = createContext<WallInputRouting>({ captured: false });

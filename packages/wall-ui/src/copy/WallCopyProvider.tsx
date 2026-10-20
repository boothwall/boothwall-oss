import React, { createContext, type ReactNode } from "react";

import { defaultWallCopy } from "./wall-copy.constants";
import type { WallCopy } from "./wall-copy.types";

export const WallCopyContext = createContext<WallCopy>(defaultWallCopy);

/** The wall's words for everything below it; without one the wall speaks today's English. */
export function WallCopyProvider({ copy, children }: { copy: WallCopy; children: ReactNode }) {
  return <WallCopyContext.Provider value={copy}>{children}</WallCopyContext.Provider>;
}

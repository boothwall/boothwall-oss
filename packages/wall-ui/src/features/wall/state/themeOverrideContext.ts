import type { WallTheme } from "@boothwall/shared";
import { createContext } from "react";

/** A theme the host shows instead of the configured one (WallScreen's `theme`). */
export const ThemeOverrideContext = createContext<WallTheme | undefined>(undefined);

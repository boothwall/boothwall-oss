import { DEFAULT_SETTINGS, type WallSettings } from "@boothwall/shared";
import { createContext } from "react";

/** The live settings, for components deep in the wall (the polaroid's caption look). */
export const WallSettingsContext = createContext<WallSettings>(DEFAULT_SETTINGS);

import { useContext } from "react";

import { WallSettingsContext } from "../state/wallSettingsContext";

/** The live settings, for any component on the wall. WallScreen provides them. */
export const useWallSettings = () => useContext(WallSettingsContext);

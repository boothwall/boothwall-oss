import { useContext } from "react";

import { WallLookContext } from "../state/wallLookContext";

/** The wall's optional looks (header, announcement, source card); empty keeps the classic wall. */
export const useWallLook = () => useContext(WallLookContext);

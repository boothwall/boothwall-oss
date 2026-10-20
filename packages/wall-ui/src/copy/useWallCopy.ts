import { useContext } from "react";

import { WallCopyContext } from "./WallCopyProvider";

export const useWallCopy = () => useContext(WallCopyContext);

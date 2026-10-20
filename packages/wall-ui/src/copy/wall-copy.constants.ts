import { JOIN_VOICE, offlineCopy, picksCopy, wallCopy } from "./english-copy.constants";
import type { WallCopy } from "./wall-copy.types";

/** Today's English, unchanged: what the wall shows when no copy is provided. */
export const defaultWallCopy: WallCopy = {
  join: JOIN_VOICE,
  wall: wallCopy,
  picks: picksCopy,
  offline: offlineCopy,
};

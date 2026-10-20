import { defaultWallCopy, type WallCopy } from "@boothwall/wall-ui";

/** The wall's words with some of its own lines worded by the host, for `presentation.wallCopy`. */
export const wallCopyWith = (wall: Partial<WallCopy["wall"]>): WallCopy => ({
  ...defaultWallCopy,
  wall: { ...defaultWallCopy.wall, ...wall },
});

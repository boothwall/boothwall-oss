import { defaultWallCopy } from "#copy";
import { offlineCopy } from "#features/offline/constants/copy";
import { picksCopy } from "#features/picks/constants/copy";
import { JOIN_VOICE, wallCopy } from "#features/wall/constants/copy";

it("the default copy is today's English constants themselves", () => {
  expect(defaultWallCopy.join).toBe(JOIN_VOICE);
  expect(defaultWallCopy.wall).toBe(wallCopy);
  expect(defaultWallCopy.picks).toBe(picksCopy);
  expect(defaultWallCopy.offline).toBe(offlineCopy);
});

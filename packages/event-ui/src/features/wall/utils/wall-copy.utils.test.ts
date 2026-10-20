import { defaultWallCopy } from "@boothwall/wall-ui";
import { expect, it } from "vitest";

import { wallCopyWith } from "./wall-copy.utils";

it("replaces only the lines a host words its own way", () => {
  const copy = wallCopyWith({ accessChanged: "Connect this screen again." });
  expect(copy.wall.accessChanged).toBe("Connect this screen again.");
  expect(copy.wall.paused).toBe(defaultWallCopy.wall.paused);
  expect(copy.picks).toBe(defaultWallCopy.picks);
});

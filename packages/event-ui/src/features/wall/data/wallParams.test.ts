import { expect, it } from "vitest";

import { readWallParams } from "./wallParams";

it("starts on a built-in theme named in the address", () => {
  expect(readWallParams("?theme=party")).toMatchObject({ theme: "party", demo: false });
});

it("ignores a theme it doesn't know", () => {
  expect(readWallParams("?theme=disco&demo")).not.toHaveProperty("theme");
  expect(readWallParams("")).not.toHaveProperty("theme");
});

import { expect, it } from "vitest";

import { DEFAULT_WALL_TARGET, scopeToWall } from "./wall-target.schemas.ts";

it("scopes requests to a host's wall and leaves the default wall's URLs alone", () => {
  const url = "https://api.test/photos?limit=80";
  expect(scopeToWall(url, DEFAULT_WALL_TARGET)).toBe(url);
  expect(scopeToWall(url, { wallId: "spring-fair", screenToken: "t/1" })).toBe(
    `${url}&wall=spring-fair&screen=t%2F1`,
  );
  expect(scopeToWall("wss://api.test/wall/live", { wallId: "x" })).toBe(
    "wss://api.test/wall/live?wall=x",
  );
});

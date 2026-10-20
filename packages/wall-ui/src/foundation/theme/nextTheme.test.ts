import { WALL_THEMES, type WallTheme } from "@boothwall/shared";

import { nextTheme } from "./nextTheme";

it("steps through every theme and wraps around", () => {
  let theme: WallTheme = WALL_THEMES[0];
  const seen = WALL_THEMES.map(() => {
    const current = theme;
    theme = nextTheme(theme);
    return current;
  });
  expect(seen).toEqual([...WALL_THEMES]);
  expect(theme).toBe(WALL_THEMES[0]);
});

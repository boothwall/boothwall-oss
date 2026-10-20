import { WALL_THEMES, type WallTheme } from "@boothwall/shared";

/** The theme after this one in `WALL_THEMES`, wrapping round: how a host steps through them. */
export function nextTheme(current: WallTheme): WallTheme {
  return WALL_THEMES[(WALL_THEMES.indexOf(current) + 1) % WALL_THEMES.length] ?? current;
}

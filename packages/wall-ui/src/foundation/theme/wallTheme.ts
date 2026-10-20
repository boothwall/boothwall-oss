import { type WallTheme } from "@boothwall/shared";
import { createContext, useContext } from "react";

import { THEME_COLORS, type WallColors } from "#foundation/tokens";

/** Named themes select artwork and copy independently of event accents. */
export const WallThemeContext = createContext<WallTheme>("universal");
export const WallColorsContext = createContext<WallColors | null>(null);

export function useWallTheme(): { theme: WallTheme; colors: WallColors } {
  const theme = useContext(WallThemeContext);
  const colors = useContext(WallColorsContext);
  return { theme, colors: colors ?? THEME_COLORS[theme] };
}

/** Cache styles by immutable palette identity, shared across component instances. */
export function themedStyles<T>(build: (colors: WallColors) => T): (colors: WallColors) => T {
  const cache = new WeakMap<WallColors, T>();
  return (colors) => {
    if (!cache.has(colors)) cache.set(colors, build(colors));
    return cache.get(colors)!;
  };
}

export function useThemedStyles<T>(resolve: (colors: WallColors) => T): T {
  return resolve(useWallTheme().colors);
}

import type { BrandPalette, WallSettings } from "@boothwall/shared";
import React, { type ReactNode, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { ThemeOverrideContext } from "#features/wall/state/themeOverrideContext";
import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { resolveWallColors } from "#theme/tokens";
import {
  themedStyles,
  useUniversalPalette,
  WallColorsContext,
  WallThemeContext,
} from "#theme/wallTheme";

export function WallPresentationCanvas({
  settings,
  palette: defaults,
  children,
}: {
  settings: WallSettings;
  palette?: BrandPalette;
  children: ReactNode;
}) {
  const theme = useContext(ThemeOverrideContext) ?? settings.theme;
  const universal = useUniversalPalette();
  // The event's own colours belong to its own theme; another theme picked live shows its own.
  const event = theme === settings.theme ? (settings.presentation?.theme ?? defaults) : undefined;
  const palette = event ?? (theme === "universal" ? universal : undefined);
  const primary = palette?.primary;
  const secondary = palette?.secondary;
  const tertiary = palette?.tertiary;
  const colors = useMemo(
    () =>
      resolveWallColors(
        theme,
        primary && secondary && tertiary ? { primary, secondary, tertiary } : undefined,
      ),
    [theme, primary, secondary, tertiary],
  );
  return (
    <WallSettingsContext.Provider value={settings}>
      <WallThemeContext.Provider value={theme}>
        <WallColorsContext.Provider value={colors}>
          <View style={[styles.canvas, themed(colors).canvas]} testID="wall-screen">
            {children}
          </View>
        </WallColorsContext.Provider>
      </WallThemeContext.Provider>
    </WallSettingsContext.Provider>
  );
}
const styles = StyleSheet.create({ canvas: { flex: 1, overflow: "hidden" } });
const themed = themedStyles((colors) =>
  StyleSheet.create({ canvas: { backgroundColor: colors.canvas } }),
);

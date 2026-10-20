import { DEFAULT_SETTINGS, withAlpha } from "@boothwall/shared";
import React from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { CUSTOM_BACKDROP_OPACITY, THEME_COLORS } from "#theme/tokens";

import { AmbientBackdrop } from "./AmbientBackdrop";

it("covers custom artwork and decorative children with the measured readability scrim", () => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider
        value={{
          ...DEFAULT_SETTINGS,
          presentation: { backdropUrl: "https://art.example.test/white.png" },
        }}
      >
        <AmbientBackdrop>
          <View testID="decorative-child" />
        </AmbientBackdrop>
      </WallSettingsContext.Provider>,
    );
  });
  const scrim = renderer.root.findAllByProps({ testID: "wall-artwork-scrim" })[0]!;
  expect(StyleSheet.flatten(scrim.props.style as StyleProp<ViewStyle>).backgroundColor).toBe(
    withAlpha(THEME_COLORS.universal.canvas, 1 - CUSTOM_BACKDROP_OPACITY),
  );
  const tree = renderer.toJSON() as Array<{ props: { testID?: string } }>;
  expect(tree.at(-1)?.props.testID).toBe("wall-artwork-scrim");
  act(() => renderer.unmount());
});

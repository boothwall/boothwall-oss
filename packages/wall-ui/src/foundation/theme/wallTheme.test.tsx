import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { THEME_COLORS } from "#foundation/tokens";

import { themedStyles, useThemedStyles, WallColorsContext, WallThemeContext } from "./wallTheme";

it("updates styles without changing named theme and reuses immutable palette styles", () => {
  const build = jest.fn((colors) => ({ accent: colors.brandPrimary }));
  const resolve = themedStyles(build);
  const original = THEME_COLORS.party;
  const custom = { ...original, brandPrimary: "#123456" };
  const seen: unknown[] = [];
  function Probe() {
    seen.push(useThemedStyles(resolve));
    return null;
  }
  const tree = (colors = original) => (
    <WallThemeContext.Provider value="party">
      <WallColorsContext.Provider value={colors}>
        <Probe />
      </WallColorsContext.Provider>
    </WallThemeContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(tree());
  });
  act(() => {
    renderer.update(tree(custom));
  });
  act(() => {
    renderer.update(tree());
  });
  expect(seen[0]).toEqual({ accent: original.brandPrimary });
  expect(seen[1]).toEqual({ accent: "#123456" });
  expect(seen[2]).toBe(seen[0]);
  expect(build).toHaveBeenCalledTimes(2);
  act(() => renderer.unmount());
});

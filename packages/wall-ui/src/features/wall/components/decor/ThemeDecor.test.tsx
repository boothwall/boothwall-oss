import { DEFAULT_SETTINGS, type WallLook, type WallTheme } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallLookContext } from "#features/wall/state/wallLookContext";
import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { signalIntensity } from "#foundation/tokens";
import { WallThemeContext } from "#theme/wallTheme";

import { ThemeDecor } from "./ThemeDecor";

function render(theme: WallTheme, look: WallLook = {}, configured: WallTheme = theme) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, theme: configured }}>
        <WallLookContext.Provider value={look}>
          <WallThemeContext.Provider value={theme}>
            <ThemeDecor beat="1" />
          </WallThemeContext.Provider>
        </WallLookContext.Provider>
      </WallSettingsContext.Provider>,
    );
  });
  return renderer;
}

/** How many drawn views carry this test id. */
const count = (renderer: ReactTestRenderer, id: string) =>
  JSON.stringify(renderer.toJSON()).split(`"testID":"${id}"`).length - 1;

describe("ThemeDecor", () => {
  it("adds nothing to the universal wall", () => {
    const renderer = render("universal");
    expect(renderer.toJSON()).toBeNull();
    act(() => renderer.unmount());
  });

  it("gives each event theme layers of its own", () => {
    const trees = (["wedding", "party", "conference"] as const).map((theme) => {
      const renderer = render(theme);
      const tree = JSON.stringify(renderer.toJSON());
      act(() => renderer.unmount());
      return tree;
    });
    expect(trees.every((tree) => tree !== "null")).toBe(true);
    expect(new Set(trees).size).toBe(trees.length);
  });

  it("keeps every theme's own layers by default and puts the signal look's in their place", () => {
    for (const theme of ["universal", "conference"] as const) {
      const classic = render(theme);
      expect(count(classic, "wall-signal-decor")).toBe(0);
      act(() => classic.unmount());
      const signal = render(theme, { motion: "signal" });
      expect(count(signal, "wall-signal-decor")).toBe(1);
      expect(count(signal, "wall-signal-ribbon")).toBe(3);
      expect(count(signal, "wall-signal-particles")).toBe(signalIntensity.particles.length);
      act(() => signal.unmount());
    }
  });

  it("gives a theme picked live its own layers, not the signal look's", () => {
    const picked = render("wedding", { motion: "signal" }, "conference");
    expect(count(picked, "wall-signal-decor")).toBe(0);
    expect(picked.toJSON()).not.toBeNull();
    act(() => picked.unmount());
  });
});

import { DEFAULT_SETTINGS } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { ThemeOverrideContext } from "#features/wall/state/themeOverrideContext";
import { resolveWallColors, THEME_COLORS } from "#theme/tokens";
import { UniversalPaletteProvider, useWallTheme } from "#theme/wallTheme";

import { WallPresentationCanvas } from "./WallPresentationCanvas";

const EVENT_PALETTE = { primary: "#FF9A1F", secondary: "#3BB5E8", tertiary: "#F6C453" };
const HOST_PALETTE = { primary: "#2E7D32", secondary: "#8FA9E5", tertiary: "#6555E8" };

function themeSeen(
  override?: "wedding" | "universal",
  palette?: typeof EVENT_PALETTE,
  host = false,
) {
  let seen: ReturnType<typeof useWallTheme> | undefined;
  function Probe() {
    seen = useWallTheme();
    return null;
  }
  act(() => {
    TestRenderer.create(
      <UniversalPaletteProvider value={host ? HOST_PALETTE : undefined}>
        <ThemeOverrideContext.Provider value={override}>
          <WallPresentationCanvas
            settings={{
              ...DEFAULT_SETTINGS,
              theme: "party",
              presentation: palette ? { theme: palette } : undefined,
            }}
          >
            <Probe />
          </WallPresentationCanvas>
        </ThemeOverrideContext.Provider>
      </UniversalPaletteProvider>,
    );
  });
  return seen;
}

it("draws the configured theme, or the host's override when it sets one", () => {
  expect(themeSeen()).toEqual({ theme: "party", colors: THEME_COLORS.party });
  expect(themeSeen("wedding")).toEqual({ theme: "wedding", colors: THEME_COLORS.wedding });
});

it("keeps the event's colours for its own theme and lets a theme picked live show its own", () => {
  expect(themeSeen(undefined, EVENT_PALETTE)?.colors).not.toEqual(THEME_COLORS.party);
  expect(themeSeen("wedding", EVENT_PALETTE)?.colors).toEqual(THEME_COLORS.wedding);
});

it("draws Universal in the host's own colours and leaves other themes and the event's alone", () => {
  expect(themeSeen("universal")?.colors).toBe(THEME_COLORS.universal);
  expect(themeSeen("universal", undefined, true)?.colors).toEqual(
    resolveWallColors("universal", HOST_PALETTE),
  );
  expect(themeSeen(undefined, undefined, true)?.colors).toBe(THEME_COLORS.party);
  expect(themeSeen(undefined, EVENT_PALETTE, true)?.colors).toEqual(
    resolveWallColors("party", EVENT_PALETTE),
  );
});

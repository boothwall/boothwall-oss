import { DEFAULT_SETTINGS, WALL_THEMES } from "@boothwall/shared";
import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { JOIN_VOICE } from "#features/wall/constants/copy";
import { HEADER_BAND, PANEL } from "#features/wall/constants/layout";
import { WallLookContext } from "#features/wall/state/wallLookContext";
import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { defaultWallConnection, WallConnectionContext } from "#platform/connection";
import { WallThemeContext } from "#theme/wallTheme";

import { JoinPanel } from "./JoinPanel";

const stats = { total: 0, byTribe: {} };

describe("JoinPanel", () => {
  it.each([
    ["https://wall.example.com/snap", "wall.example.com/snap"],
    ["https://oss.example.com/demo/snap", undefined],
  ])("shows the join address %s only when it fits on one line", (joinUrl, shown) => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WallConnectionContext.Provider value={{ ...defaultWallConnection(), joinUrl }}>
          <JoinPanel stats={stats} pool={[]} />
        </WallConnectionContext.Provider>,
      );
    });
    const texts = renderer.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(texts.find((text) => text.includes("example.com"))).toBe(shown);
    act(() => renderer.unmount());
  });

  it.each(WALL_THEMES)("asks guests to join in the %s theme's own words", (theme) => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WallSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, showWhoIsHere: false }}>
          <WallThemeContext.Provider value={theme}>
            <JoinPanel stats={stats} pool={[]} />
          </WallThemeContext.Provider>
        </WallSettingsContext.Provider>,
      );
    });
    const texts = renderer.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain(JOIN_VOICE[theme].title);
    expect(texts).toContain(JOIN_VOICE[theme].hint);
    act(() => renderer.unmount());
  });

  it("keeps the source card off unless the config's credits turn it on", () => {
    const sourceCards = (showSource: boolean | undefined) => {
      const connection = defaultWallConnection();
      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <WallConnectionContext.Provider
            value={showSource === undefined ? connection : { ...connection, showSource }}
          >
            <WallSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, showWhoIsHere: false }}>
              <JoinPanel stats={{ total: 3, byTribe: {} }} pool={[]} />
            </WallSettingsContext.Provider>
          </WallConnectionContext.Provider>,
        );
      });
      const found = renderer.root.findAllByProps({ testID: "wall-source" }).length;
      act(() => renderer.unmount());
      return found;
    };
    // The example config sets no `credits`, so the build's own connection leaves the card off.
    expect(defaultWallConnection().showSource).toBe(false);
    expect(sourceCards(undefined)).toBe(0);
    expect(sourceCards(true)).toBeGreaterThan(0);
  });

  it("starts the column under the split header's band, the join card between equal gaps", () => {
    const column = (look: { header?: "split" }) => {
      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <WallLookContext.Provider value={look}>
            <JoinPanel stats={{ total: 3, byTribe: {} }} pool={[]} />
          </WallLookContext.Provider>,
        );
      });
      const styles = renderer.root
        .findAllByType(View)
        .map((node) => StyleSheet.flatten(node.props.style as ViewStyle) ?? {});
      const shown = { top: styles[0]!.top, spacers: styles.filter((s) => s.flex === 1).length };
      act(() => renderer.unmount());
      return shown;
    };
    const classic = column({});
    const split = column({ header: "split" });
    expect(classic.top).toBe(PANEL.top);
    expect(split.top).toBe(HEADER_BAND.bottom);
    expect(split.spacers).toBe(classic.spacers + 1);
  });
});

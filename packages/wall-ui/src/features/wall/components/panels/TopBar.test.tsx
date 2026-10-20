import { DEFAULT_SETTINGS } from "@boothwall/shared";
import React from "react";
import { Image, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallLookContext } from "#features/wall/state/wallLookContext";
import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { defaultWallConnection, WallConnectionContext } from "#platform/connection";
import { fontSize, size } from "#theme/tokens";

import { TopBar } from "./TopBar";

it.each([
  ["native", { nativeEvent: { source: { width: 600, height: 200 } } }],
  ["web", { nativeEvent: { target: { naturalWidth: 600, naturalHeight: 200 } } }],
])("reads custom logo dimensions from the %s image event", (_platform, event) => {
  const resolve = jest
    .spyOn(Image, "resolveAssetSource")
    .mockReturnValue({ uri: "bundled", width: 400, height: 200, scale: 1 });
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider
        value={{
          ...DEFAULT_SETTINGS,
          presentation: { logoUrl: "https://art.example.test/logo.png" },
        }}
      >
        <TopBar total={0} status="live" ended />
      </WallSettingsContext.Provider>,
    );
  });
  const logo = () => renderer.root.findAllByProps({ testID: "wall-logo" })[0]!;
  const load = (payload: unknown) => (logo().props.onLoad as (value: unknown) => void)(payload);
  act(() => load(event));
  expect(StyleSheet.flatten(logo().props.style as StyleProp<ViewStyle>).width).toBe(
    size.logoHeight * 3,
  );
  for (const invalid of [
    { nativeEvent: {} },
    { nativeEvent: { source: { width: 0, height: 0 } } },
    { nativeEvent: { target: { naturalWidth: Infinity, naturalHeight: 2 } } },
  ]) {
    act(() => load(invalid));
    expect(StyleSheet.flatten(logo().props.style as StyleProp<ViewStyle>).width).toBe(
      size.logoHeight * 3,
    );
  }
  act(() => renderer.unmount());
  resolve.mockRestore();
});

function header(look: { header?: "classic" | "split" }) {
  const connection = { ...defaultWallConnection(), badge: "Demo", venue: "Hall A" };
  const settings = { ...DEFAULT_SETTINGS, eventHashtag: "#Launch", eventYear: "2026" };
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallConnectionContext.Provider value={connection}>
        <WallSettingsContext.Provider value={settings}>
          <WallLookContext.Provider value={look}>
            <TopBar total={12} status="live" />
          </WallLookContext.Provider>
        </WallSettingsContext.Provider>
      </WallConnectionContext.Provider>,
    );
  });
  const ids = (id: string) => renderer.root.findAllByProps({ testID: id }).length > 0;
  const texts = renderer.root.findAllByType(Text).map((node) => node.props.children);
  const shown = {
    lockup: ids("wall-lockup"),
    logo: ids("wall-logo"),
    live: ids("status-pill"),
    count: texts.includes("moments"),
    texts,
  };
  act(() => renderer.unmount());
  return shown;
}

it("keeps the classic header unless the split look is chosen", () => {
  const classic = header({});
  expect(classic).toMatchObject({ lockup: false, logo: true, live: true, count: true });
  expect(classic.texts).toEqual(expect.arrayContaining(["Hall A", "Demo", "#Launch"]));
});

it("splits the header: the lockup, then the event with its count and Live on two rows", () => {
  const split = header({ header: "split" });
  expect(split).toMatchObject({ lockup: true, logo: true, live: true, count: true });
  expect(split.texts).toEqual(expect.arrayContaining(["2026", "#Launch", "Hall A", "Demo", "·"]));
});

it("lets a wide event wordmark keep its shape in the split header on the web", () => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider
        value={{ ...DEFAULT_SETTINGS, presentation: { logoUrl: "https://art.example.test/w.png" } }}
      >
        <WallLookContext.Provider value={{ header: "split" }}>
          <TopBar total={0} status="live" />
        </WallLookContext.Provider>
      </WallSettingsContext.Provider>,
    );
  });
  const logo = () => renderer.root.findAllByProps({ testID: "wall-logo" })[0]!;
  act(() =>
    (logo().props.onLoad as (value: unknown) => void)({
      nativeEvent: { target: { naturalWidth: 926, naturalHeight: 150 } },
    }),
  );
  expect(StyleSheet.flatten(logo().props.style as StyleProp<ViewStyle>).width).toBeCloseTo(
    fontSize.eventTitle * size.eventLogoEm * (926 / 150),
  );
  act(() => renderer.unmount());
});

it("sizes a custom logo from Image.getSize when the load event carries no size, as on the web", () => {
  const getSize = jest
    .spyOn(Image, "getSize")
    .mockImplementation((_url, success) => success?.(926, 150));
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider
        value={{ ...DEFAULT_SETTINGS, presentation: { logoUrl: "https://art.example.test/w.png" } }}
      >
        <WallLookContext.Provider value={{ header: "split" }}>
          <TopBar total={0} status="live" />
        </WallLookContext.Provider>
      </WallSettingsContext.Provider>,
    );
  });
  const logo = renderer.root.findAllByProps({ testID: "wall-logo" })[0]!;
  expect(StyleSheet.flatten(logo.props.style as StyleProp<ViewStyle>).width).toBeCloseTo(
    fontSize.eventTitle * size.eventLogoEm * (926 / 150),
  );
  act(() => renderer.unmount());
  getSize.mockRestore();
});

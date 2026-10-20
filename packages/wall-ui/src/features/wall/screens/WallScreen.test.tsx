import type * as Shared from "@boothwall/shared";
import { type BoothwallConfig, DEFAULT_SETTINGS, type WallConnection } from "@boothwall/shared";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { useWallTheme } from "#foundation/theme";

import { useWallSettings } from "../hooks/useWallSettings";
import { WallScreen } from "./WallScreen";

jest.mock("../data/connectLive", () => ({ connectLive: jest.fn(() => () => undefined) }));
jest.mock("@boothwall/shared", () => {
  const actual: typeof Shared = jest.requireActual("@boothwall/shared");
  const config: BoothwallConfig = { ...actual.boothwallConfig, wall: { header: "split" } };
  return { ...actual, boothwallConfig: config };
});

const connection: WallConnection = {
  apiBaseUrl: "https://api.test",
  target: { wallId: "wall" },
  joinUrl: "https://wall.test/snap",
  sourceUrl: "https://source.test",
  sourceLabel: "Source",
  showSource: false,
  storageNamespace: "look-test",
  initialSettings: DEFAULT_SETTINGS,
};

function headerOf(look?: BoothwallConfig["wall"]) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallScreen connection={connection} useRemoteInput={() => undefined} look={look} />,
    );
  });
  const has = (id: string) => renderer.root.findAllByProps({ testID: id }).length > 0;
  const shown = { lockup: has("wall-lockup"), logo: has("wall-logo") };
  act(() => renderer.unmount());
  return shown;
}

it("keeps a host that passes no look on the classic header whatever the config says", () => {
  expect(headerOf()).toEqual({ lockup: false, logo: true });
});

it("splits the header when the host passes the config's look, as the open edition's apps do", () => {
  expect(headerOf({ header: "split" })).toEqual({ lockup: true, logo: true });
});

it("draws a host's overlay inside the wall, in the theme and settings on screen", () => {
  function Probe() {
    const { theme } = useWallTheme();
    return <Text testID="host-overlay">{`${theme} ${useWallSettings().eventName}`}</Text>;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallScreen
        connection={connection}
        useRemoteInput={() => undefined}
        theme="party"
        overlay={<Probe />}
      />,
    );
  });
  const [probe] = renderer.root.findAllByProps({ testID: "host-overlay" });
  expect(probe?.props.children).toBe(`party ${DEFAULT_SETTINGS.eventName}`);
  act(() => renderer.unmount());
});

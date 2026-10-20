import { DEFAULT_SETTINGS, type WallConnection } from "@boothwall/shared";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { defaultWallCopy } from "#copy";

import type { WallDisplayObserver } from "../types";
import { WallScreen } from "./WallScreen";

jest.mock("../data/connectLive", () => ({ connectLive: jest.fn(() => () => undefined) }));

const connection: WallConnection = {
  apiBaseUrl: "https://api.test",
  target: { wallId: "wall" },
  joinUrl: "https://wall.test/snap",
  sourceUrl: "https://source.test",
  sourceLabel: "Source",
  showSource: false,
  storageNamespace: "access-test",
  initialSettings: DEFAULT_SETTINGS,
};

function revokedText(copy?: typeof defaultWallCopy) {
  let observer!: WallDisplayObserver;
  const source = {
    connect: (next: WallDisplayObserver) => {
      observer = next;
      return () => undefined;
    },
  };
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallScreen
        connection={connection}
        source={source}
        useRemoteInput={() => undefined}
        copy={copy}
      />,
    );
  });
  act(() => observer.revoked());
  const text = renderer.root.findAllByType(Text).map((node) => node.props.children);
  act(() => renderer.unmount());
  return text;
}

it("says the screen lost access in the wall's own words", () => {
  expect(revokedText()).toContain(defaultWallCopy.wall.accessChanged);
});

it("lets a host say it in its own words", () => {
  const copy = {
    ...defaultWallCopy,
    wall: { ...defaultWallCopy.wall, accessChanged: "Connect this screen again." },
  };
  expect(revokedText(copy)).toContain("Connect this screen again.");
});

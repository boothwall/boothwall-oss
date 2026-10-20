import { DEFAULT_SETTINGS } from "@boothwall/shared";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallLookContext } from "#features/wall/state/wallLookContext";
import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { defaultWallConnection, WallConnectionContext } from "#platform/connection";

import { SourceCard } from "./SourceCard";

it("renders custom credit text visibly for connection defaults and live settings", () => {
  const connection = {
    ...defaultWallConnection(),
    sourceUrl: "https://venue.example.test",
    sourceLabel: "Our venue",
  };
  const tree = (sourceLabel?: string) => (
    <WallConnectionContext.Provider value={connection}>
      <WallSettingsContext.Provider
        value={{ ...DEFAULT_SETTINGS, presentation: sourceLabel ? { sourceLabel } : undefined }}
      >
        <SourceCard />
      </WallSettingsContext.Provider>
    </WallConnectionContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(tree());
  });
  const texts = () => renderer.root.findAllByType(Text).map((node) => node.props.children);
  expect(texts()).toContain("Our venue");
  expect(texts()).toContain("venue.example.test");
  act(() => renderer.update(tree("Thanks to our hosts")));
  expect(texts()).toContain("Thanks to our hosts");
  expect(texts()).not.toContain("Our venue");
  act(() => renderer.unmount());
});

it("names the repo beside the host's mark when the look sets one, with a QR straight to it and no address printed", () => {
  let renderer!: ReactTestRenderer;
  const source = { repo: "boothwall/boothwall-oss", host: "github.com", license: "MIT" };
  act(() => {
    renderer = TestRenderer.create(
      <WallLookContext.Provider value={{ source }}>
        <SourceCard />
      </WallLookContext.Provider>,
    );
  });
  const texts = renderer.root
    .findAllByType(Text)
    .flatMap((node) => [node.props.children].flat())
    .filter((part) => typeof part === "string");
  expect(texts).toEqual(expect.arrayContaining(["boothwall-oss", "Open source", "MIT"]));
  expect(texts.join(" ")).not.toMatch(/https?:|github\.com|boothwall\//i);
  expect(renderer.root.findAllByProps({ testID: "wall-source" })[0]?.props.accessibilityLabel).toBe(
    "Open source: boothwall/boothwall-oss",
  );
  const qr = { accessibilityLabel: "HTTPS://GITHUB.COM/BOOTHWALL/BOOTHWALL-OSS" };
  expect(renderer.root.findAllByProps(qr).length).toBeGreaterThan(0);
  act(() => renderer.unmount());
});

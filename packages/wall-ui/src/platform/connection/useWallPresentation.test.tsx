import { DEFAULT_SETTINGS, type EventPresentation } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";

import { useWallPresentation } from "./useWallPresentation";
import { defaultWallConnection, WallConnectionContext } from "./wallConnection";

it("resolves live presentation against the selected connection without losing null artwork", () => {
  const connection = {
    ...defaultWallConnection(),
    apiBaseUrl: "https://api.example.test/api",
    badge: "Original",
    presentation: { logoUrl: "/default.png" },
  };
  let value!: EventPresentation;
  function Probe() {
    value = useWallPresentation();
    return null;
  }
  const tree = (presentation?: EventPresentation) => (
    <WallConnectionContext.Provider value={connection}>
      <WallSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, presentation }}>
        <Probe />
      </WallSettingsContext.Provider>
    </WallConnectionContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(tree({ badge: "Live", venue: "Vienna", logoUrl: "/new.png" }));
  });
  expect(value).toMatchObject({
    badge: "Live",
    venue: "Vienna",
    logoUrl: "https://api.example.test/api/new.png",
  });
  act(() => renderer.update(tree({ logoUrl: null })));
  expect(value.logoUrl).toBeNull();
  act(() => renderer.update(tree({})));
  expect(value).toMatchObject({
    badge: "Original",
    logoUrl: "https://api.example.test/api/default.png",
  });
  act(() => renderer.unmount());
});

import { DEFAULT_SETTINGS, type WallConnection } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { wallCacheKey } from "#features/offline/utils/wallCache";
import { defaultWallConnection, WallConnectionContext } from "#platform/connection";

import { EventOverScreen } from "../components/overlays/EventOverScreen";
import { JoinPanel } from "../components/panels/JoinPanel";

const connection: WallConnection = {
  apiBaseUrl: "https://api-a.test",
  target: { wallId: "a" },
  joinUrl: "https://events.test/w/MixedCase/snap?invitation=AbC",
  recapUrl: "https://events.test/w/MixedCase/recap",
  sourceUrl: "https://source.test/Project",
  sourceLabel: "Source",
  showSource: false,
  storageNamespace: '["https://api-a.test","a"]',
  initialSettings: DEFAULT_SETTINGS,
};
it("uses exact connection URLs for join and recap without uppercasing paths", () => {
  let view!: ReactTestRenderer;
  act(() => {
    view = TestRenderer.create(
      <WallConnectionContext.Provider value={connection}>
        <JoinPanel stats={{ total: 0, byTribe: {} }} pool={[]} attention />
        <EventOverScreen total={0} />
      </WallConnectionContext.Provider>,
    );
  });
  try {
    for (const url of [connection.joinUrl, connection.recapUrl]) {
      expect(view.root.findAllByProps({ accessibilityLabel: url }).length).toBeGreaterThan(0);
    }
  } finally {
    act(() => view.unmount());
  }
});
it("separates caches for the same wall on different API origins", () => {
  expect(wallCacheKey(connection.storageNamespace)).not.toBe(
    wallCacheKey('["https://api-b.test","a"]'),
  );
});

it("shows an ended event without a recap link or a dead QR invitation", () => {
  let view!: ReactTestRenderer;
  const basic = { ...connection, recapUrl: undefined };
  act(() => {
    view = TestRenderer.create(
      <WallConnectionContext.Provider value={basic}>
        <EventOverScreen total={7} />
      </WallConnectionContext.Provider>,
    );
  });
  try {
    const text = JSON.stringify(view.toJSON());
    expect(text).toContain("Thanks for coming!");
    expect(text).toContain(DEFAULT_SETTINGS.eventName);
    expect(text).toContain("7 moments on the wall");
    expect(text).not.toContain("Scan");
    expect(text).not.toMatch(/"accessibilityLabel":"https?:/);
  } finally {
    act(() => view.unmount());
  }
});

it("gives the build's own wall no recap link, since the open edition has no recap page", () => {
  expect(defaultWallConnection().recapUrl).toBeUndefined();
});

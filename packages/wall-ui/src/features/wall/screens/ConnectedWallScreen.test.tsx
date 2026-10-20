import { DEFAULT_SETTINGS, type PhotoDTO, type WallConnection } from "@boothwall/shared";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { PICK_TIMING, picksCopy } from "#features/picks";
import { WallConnectionContext } from "#platform/connection";
import type { RemoteHandlers } from "#platform/input";

import { wallCopy } from "../constants/copy";
import { connectLive } from "../data/connectLive";
import { ConnectedWallScreen } from "./ConnectedWallScreen";

jest.mock("../data/connectLive", () => ({ connectLive: jest.fn(() => () => undefined) }));
jest.mock("#platform/motion", () => ({
  ...jest.requireActual("#platform/motion"),
  useReducedMotion: () => true,
  NATIVE_DRIVER: false,
}));

const photo: PhotoDTO = {
  id: "a",
  status: "approved",
  caption: "First photo",
  tribe: "guests",
  imageUrl: "https://api.test/photos/a/image",
  thumbUrl: "https://api.test/photos/a/thumb",
  createdAt: "2026-10-13T12:00:00.000Z",
  reactions: { heart: 4, fire: 0, laugh: 0, clap: 0 },
};

const texts = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map((node) => node.props.children);

function mount(playbackPaused: boolean) {
  const settings = { ...DEFAULT_SETTINGS, playbackPaused, showPicks: true, autoOpen: false };
  const connection: WallConnection = {
    apiBaseUrl: "https://api.test",
    target: { wallId: "wall" },
    joinUrl: "https://wall.test/snap",
    sourceUrl: "https://source.test",
    sourceLabel: "Source",
    showSource: false,
    storageNamespace: "playback-test",
    initialSettings: settings,
  };
  let remote!: RemoteHandlers;
  let feed!: Parameters<typeof connectLive>[0];
  jest.mocked(connectLive).mockImplementation((options) => {
    feed = options;
    return () => undefined;
  });
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallConnectionContext.Provider value={connection}>
        <ConnectedWallScreen
          resolved={connection}
          demo={false}
          useRemoteInput={(handlers) => {
            remote = handlers;
          }}
        />
      </WallConnectionContext.Provider>,
    );
  });
  act(() => {
    feed.dispatch({
      type: "snapshot",
      snapshot: { photos: [photo], stats: { total: 1, byTribe: {} }, settings },
    });
    feed.setStatus("live");
    feed.onLoaded();
  });
  return {
    renderer,
    pause: () =>
      act(() =>
        feed.dispatch({ type: "settings", settings: { ...settings, playbackPaused: true } }),
      ),
    press: (command: keyof RemoteHandlers) => act(() => remote[command]?.()),
    unmount: () => act(() => renderer.unmount()),
  };
}

describe("ConnectedWallScreen playback", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("shows persisted pause in the footer and spotlight while suppressing scheduled picks", () => {
    const wall = mount(true);
    try {
      expect(texts(wall.renderer)).toContain(wallCopy.paused);
      act(() => jest.advanceTimersByTime(PICK_TIMING.firstAfterMs + PICK_TIMING.retryMs));
      expect(texts(wall.renderer)).not.toContain(picksCopy.crowd);
      wall.press("select");
      expect(texts(wall.renderer).filter((text) => text === wallCopy.paused)).toHaveLength(2);
      expect(
        wall.renderer.root.findAllByProps({ testID: "wall-spotlight" }).length,
      ).toBeGreaterThan(0);
    } finally {
      wall.unmount();
    }
  });

  it("closes an active pick when a persisted pause arrives and keeps legacy playback input", () => {
    const wall = mount(false);
    try {
      act(() => jest.advanceTimersByTime(PICK_TIMING.firstAfterMs));
      expect(texts(wall.renderer)).toContain(picksCopy.crowd);
      wall.pause();
      expect(texts(wall.renderer)).not.toContain(picksCopy.crowd);
      expect(texts(wall.renderer)).toContain(wallCopy.paused);
      wall.press("playpause");
      expect(texts(wall.renderer)).not.toContain(wallCopy.paused);
    } finally {
      wall.unmount();
    }
  });
});

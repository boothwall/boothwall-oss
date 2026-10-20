import { DEFAULT_SETTINGS } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { connectLive } from "../data/connectLive";
import type { WallDisplayObserver } from "../types";
import { useWallFeed } from "./useWallFeed";

jest.mock("../data/connectLive", () => ({ connectLive: jest.fn(() => () => undefined) }));

it("uses an injected display source for snapshots, events, navigation and revocation, then disposes it", () => {
  let observer!: WallDisplayObserver;
  const stop = jest.fn(),
    onRemote = jest.fn(),
    onAccessRevoked = jest.fn();
  const source = {
    connect: jest.fn((next: WallDisplayObserver) => {
      observer = next;
      return stop;
    }),
  };
  let state!: ReturnType<typeof useWallFeed>, view!: ReactTestRenderer;
  function Probe() {
    state = useWallFeed({
      target: { wallId: "device" },
      demo: false,
      source,
      onRemote,
      onAccessRevoked,
    });
    return null;
  }
  act(() => {
    view = TestRenderer.create(<Probe />);
  });
  expect(source.connect).toHaveBeenCalledTimes(1);
  expect(connectLive).not.toHaveBeenCalled();
  act(() => {
    observer.snapshot({ photos: [], stats: { total: 7, byTribe: {} }, settings: DEFAULT_SETTINGS });
    observer.status("live");
    observer.event({ type: "remote.command", command: "left" });
    observer.event({
      type: "settings.updated",
      settings: { ...DEFAULT_SETTINGS, eventName: "Injected" },
    });
  });
  expect(state.state.stats.total).toBe(7);
  expect(state.state.settings.eventName).toBe("Injected");
  expect(state.status).toBe("live");
  expect(onRemote).toHaveBeenCalledWith("left");
  act(() => observer.revoked());
  expect(state.revoked).toBe(true);
  expect(onAccessRevoked).toHaveBeenCalledTimes(1);
  act(() => view.unmount());
  expect(stop).toHaveBeenCalledTimes(1);
});

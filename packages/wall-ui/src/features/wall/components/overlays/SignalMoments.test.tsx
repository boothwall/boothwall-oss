import type { WallLook } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallLookContext } from "#features/wall/state/wallLookContext";
import { initialWallState, type WallState } from "#features/wall/state/wallState";
import { SLOT_POSITIONS } from "#features/wall/utils/collageLayout";
import { signal } from "#foundation/tokens";

import { SignalMoments } from "./SignalMoments";

const resting: WallState = {
  ...initialWallState,
  slots: ["a", ...initialWallState.slots.slice(1)],
};
const arrived: WallState = {
  ...resting,
  slots: ["a", "b", ...resting.slots.slice(2)],
  fresh: ["b"],
};

function mount(look: WallLook) {
  const at = (wall: WallState) => (
    <WallLookContext.Provider value={look}>
      <SignalMoments wall={wall} positions={SLOT_POSITIONS} drifts={[]} />
    </WallLookContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(at(resting));
  });
  // What is drawn, by sprite: the light's tail, the landing's ripples and the page turn's glow.
  const drawn = (sprite: string) => JSON.stringify(renderer.toJSON()).split(sprite).length - 1;
  const shown = () => ({
    travels: drawn("streak-blue.png"),
    ripples: drawn("ring.png"),
    sweeps: drawn("glow-orange.png"),
  });
  return { renderer, shown, show: (wall: WallState) => act(() => renderer.update(at(wall))) };
}

describe("SignalMoments", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("adds nothing to the classic wall when a photo arrives or the page turns", () => {
    const wall = mount({});
    wall.show(arrived);
    wall.show({ ...arrived, turn: 1 });
    expect(wall.shown()).toEqual({ travels: 0, ripples: 0, sweeps: 0 });
    act(() => wall.renderer.unmount());
  });

  it("carries a new photo's light to its card, lands it, and sweeps the page turn", () => {
    const wall = mount({ motion: "signal" });
    expect(wall.shown()).toEqual({ travels: 0, ripples: 0, sweeps: 0 });
    wall.show(arrived);
    expect(wall.shown()).toEqual({
      travels: 1,
      ripples: signal.arrival.rings.length,
      sweeps: 0,
    });
    // The same photo staying fresh doesn't land again.
    wall.show({ ...arrived, stats: { total: 2, byTribe: {} } });
    expect(wall.shown().travels).toBe(1);
    act(() => jest.advanceTimersByTime(signal.arrival.lifeMs));
    expect(wall.shown().travels).toBe(0);
    wall.show({ ...arrived, turn: 1 });
    expect(wall.shown().sweeps).toBe(1);
    act(() => wall.renderer.unmount());
  });
});

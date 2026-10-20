import React from "react";
import { AccessibilityInfo, Animated } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { signalIntensity } from "#foundation/tokens";

import { SignalDecor } from "./SignalDecor";

const loop = Animated.loop;

/** Loops started and not yet stopped. */
function runningLoops() {
  const running = new Set<Animated.CompositeAnimation>();
  jest.spyOn(Animated, "loop").mockImplementation((animation, config) => {
    const real = loop(animation, config);
    const tracked = {
      ...real,
      start: (callback?: Animated.EndCallback) => {
        running.add(tracked);
        real.start(callback);
      },
      stop: () => {
        running.delete(tracked);
        real.stop();
      },
    };
    return tracked;
  });
  return running;
}

async function render(reduced: boolean) {
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(reduced);
  const running = runningLoops();
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<SignalDecor beat="1" />);
  });
  const tree = JSON.stringify(renderer.toJSON());
  const loops = running.size;
  act(() => renderer.unmount());
  return { tree, loops, after: running.size };
}

describe("SignalDecor", () => {
  afterEach(() => jest.restoreAllMocks());

  it("flows on one native loop per layer, and holds a still frame with reduced motion", async () => {
    const moving = await render(false);
    // Three ribbons and the particle layers; all stop when the wall goes.
    expect(moving).toMatchObject({ loops: 3 + signalIntensity.particles.length, after: 0 });
    const still = await render(true);
    expect(still.loops).toBe(0);
    // The same picture, resting where each layer starts.
    expect(still.tree).toBe(moving.tree);
  });
});

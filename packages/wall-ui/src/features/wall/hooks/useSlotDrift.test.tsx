import React from "react";
import type { Animated } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { useReducedMotion } from "#platform/motion";

import { SLOT_COUNT, type SlotDrift } from "../constants/layout";
import { CARD_DRIFT_MS } from "../constants/timing";
import { useSlotDrift } from "./useSlotDrift";

// JavaScript-driven, so the test can read the offset the native side would see.
jest.mock("#platform/motion", () => ({
  useReducedMotion: jest.fn(() => false),
  NATIVE_DRIVER: false,
}));

const reducedMotion = jest.mocked(useReducedMotion);

/** The offset a drift gives right now, in dp. */
const offsetOf = (drift: SlotDrift) =>
  (
    drift as unknown as Animated.AnimatedInterpolation<number> & { __getValue(): number }
  ).__getValue();

function mount(count: number) {
  let drifts: readonly SlotDrift[] = [];
  function Probe() {
    drifts = useSlotDrift(count);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe />);
  });
  return { drifts: () => drifts, renderer };
}

describe("useSlotDrift", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("gives each slot its own drift", () => {
    reducedMotion.mockReturnValue(false);
    const { drifts, renderer } = mount(SLOT_COUNT);
    expect(drifts()).toHaveLength(SLOT_COUNT);
    expect(new Set(drifts()).size).toBe(SLOT_COUNT);
    act(() => renderer.unmount());
  });

  it("rests at offset 0 with reduced motion", () => {
    reducedMotion.mockReturnValue(true);
    const { drifts, renderer } = mount(SLOT_COUNT);
    act(() => jest.advanceTimersByTime(CARD_DRIFT_MS * 2));
    drifts().forEach((drift) => expect(offsetOf(drift)).toBe(0));
    act(() => renderer.unmount());
  });
});

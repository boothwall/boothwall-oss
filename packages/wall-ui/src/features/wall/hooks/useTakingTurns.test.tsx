import React from "react";
import type { Animated } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { useReducedMotion } from "#platform/motion";

import { SOURCE_TURN } from "../constants/timing";
import { useTakingTurns } from "./useTakingTurns";

// JavaScript-driven, so the test can read the value the native side would see.
jest.mock("#platform/motion", () => ({
  useReducedMotion: jest.fn(() => false),
  NATIVE_DRIVER: false,
}));

const reducedMotion = jest.mocked(useReducedMotion);

/** The value an Animated.Value holds right now. */
const valueOf = (value: Animated.Value) =>
  (value as unknown as { __getValue(): number }).__getValue();

function mount(enabled: boolean) {
  let turn!: Animated.Value;
  function Probe() {
    turn = useTakingTurns(enabled);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe />);
  });
  return { turn: () => turn, renderer };
}

describe("useTakingTurns", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reduced motion switches at once, so each step can be read without running a fade.
    reducedMotion.mockReturnValue(true);
  });
  afterEach(() => jest.useRealTimers());

  it("holds at 0 when disabled", () => {
    const { turn, renderer } = mount(false);
    act(() => jest.advanceTimersByTime(SOURCE_TURN.everyMs * 3));
    expect(valueOf(turn())).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
    act(() => renderer.unmount());
  });

  it("hands over at everyMs and hands back after showMs", () => {
    const { turn, renderer } = mount(true);
    act(() => jest.advanceTimersByTime(SOURCE_TURN.everyMs - 1));
    expect(valueOf(turn())).toBe(0);
    act(() => jest.advanceTimersByTime(1));
    expect(valueOf(turn())).toBe(1);
    act(() => jest.advanceTimersByTime(SOURCE_TURN.showMs - 1));
    expect(valueOf(turn())).toBe(1);
    act(() => jest.advanceTimersByTime(1));
    expect(valueOf(turn())).toBe(0);
    act(() => renderer.unmount());
  });

  it("clears its timers on unmount, mid-turn included", () => {
    const { turn, renderer } = mount(true);
    act(() => jest.advanceTimersByTime(SOURCE_TURN.everyMs));
    expect(valueOf(turn())).toBe(1);
    expect(jest.getTimerCount()).toBe(2);
    act(() => renderer.unmount());
    expect(jest.getTimerCount()).toBe(0);
    expect(valueOf(turn())).toBe(0);
  });
});

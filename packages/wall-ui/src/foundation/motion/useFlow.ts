import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";

import { NATIVE_DRIVER } from "./nativeDriver";
import { useReducedMotion } from "./useReducedMotion";

export type FlowOptions = {
  /** Where it starts, and where it rests with reduced motion, between 0 and 1. */
  phase?: number;
  /** Hold where it is; it carries on from there. */
  paused?: boolean;
};

/**
 * A value that runs 0 → 1 at an even pace and wraps round, forever, on the native driver, like
 * useCycle, but it can start part-way and pause and resume without a jump. With reduced motion
 * it rests at `phase`.
 */
export function useFlow(periodMs: number, { phase = 0, paused = false }: FlowOptions = {}) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(phase)).current;
  const at = useRef(phase);
  useEffect(() => {
    if (reduced) {
      at.current = phase;
      value.setValue(phase);
      return;
    }
    if (paused) return;
    const from = at.current;
    const startedAt = Date.now();
    value.setValue(from);
    // One native loop from `from` to `from + 1`, replayed from `from`; the fold below wraps it.
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: from + 1,
        duration: periodMs,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      // The loop runs natively, so where it stopped is worked out from the clock.
      at.current = (from + (Date.now() - startedAt) / periodMs) % 1;
      value.setValue(at.current);
    };
  }, [paused, periodMs, phase, reduced, value]);
  return useMemo(
    () => value.interpolate({ inputRange: [0, 1, 1, 2], outputRange: [0, 1, 0, 1] }),
    [value],
  );
}

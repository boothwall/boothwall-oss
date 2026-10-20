import { useEffect, useRef } from "react";
import { Animated, Easing, type EasingFunction } from "react-native";

import { NATIVE_DRIVER } from "./nativeDriver";
import { useReducedMotion } from "./useReducedMotion";

export type OneShotOptions = {
  delayMs?: number;
  easing?: EasingFunction;
  /** Runs again from 0 whenever this changes. */
  replay?: unknown;
};

const EASE_OUT = Easing.out(Easing.cubic);

/**
 * A value that runs 0 → 1 once on the native driver, when it mounts and on each `replay`: for
 * one-off flourishes. With reduced motion it stays at 0.
 */
export function useOneShot(
  durationMs: number,
  { delayMs = 0, easing = EASE_OUT, replay }: OneShotOptions = {},
) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    if (reduced) return;
    const run = Animated.timing(value, {
      toValue: 1,
      duration: durationMs,
      delay: delayMs,
      easing,
      useNativeDriver: NATIVE_DRIVER,
    });
    run.start();
    return () => run.stop();
  }, [delayMs, durationMs, easing, reduced, replay, value]);
  return { value, reduced };
}

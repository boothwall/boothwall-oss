import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

import { NATIVE_DRIVER } from "./nativeDriver";
import { useReducedMotion } from "./useReducedMotion";

/**
 * A value that runs 0 → 1 at an even pace and starts over, forever, on the native driver: for
 * things that keep going one way, like confetti falling. With reduced motion it rests at 0.
 */
export function useCycle(periodMs: number) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    if (reduced) return;
    // A loop replays from the value it started at, so each cycle restarts at 0 without a step.
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration: periodMs,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [periodMs, reduced, value]);
  return value;
}

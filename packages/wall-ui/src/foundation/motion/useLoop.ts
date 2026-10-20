import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

import { NATIVE_DRIVER } from "./nativeDriver";
import { useReducedMotion } from "./useReducedMotion";

export type LoopOptions = {
  /** Hold still for now (e.g. a card that is hidden while the spotlight shows it). */
  paused?: boolean;
  /** Where the value rests while still, between 0 and 1. */
  rest?: number;
};

/**
 * A value that eases 0 → 1 → 0 forever, `halfMs` each way, on the native driver: for breathing,
 * pulsing and drifting. With reduced motion (or `paused`) it rests at `rest`.
 */
export function useLoop(halfMs: number, { paused = false, rest = 0 }: LoopOptions = {}) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(rest)).current;
  useEffect(() => {
    // Reduced motion and a pause both rest the value.
    if (reduced || paused) {
      value.setValue(rest);
      return;
    }
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER };
    // A loop replays each cycle from the value it started at, natively too, so the cycle runs
    // rest → 1 → 0 → rest and ends where it starts: no snap between cycles.
    value.setValue(rest);
    const steps = [
      Animated.timing(value, { toValue: 1, duration: halfMs * (1 - rest), ...ease }),
      Animated.timing(value, { toValue: 0, duration: halfMs, ...ease }),
    ];
    if (rest > 0) {
      steps.push(Animated.timing(value, { toValue: rest, duration: halfMs * rest, ...ease }));
    }
    const loop = Animated.loop(Animated.sequence(steps));
    loop.start();
    return () => loop.stop();
  }, [halfMs, paused, reduced, rest, value]);
  return value;
}

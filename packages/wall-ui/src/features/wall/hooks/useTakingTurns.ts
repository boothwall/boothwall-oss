import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

import { NATIVE_DRIVER } from "#platform/motion";
import { useReducedMotion } from "#platform/motion";

import { SOURCE_TURN } from "../constants/timing";

/**
 * 0 while the main card shows, 1 while its guest takes the slot: every `everyMs` for `showMs`,
 * crossfading on the native driver (switching at once with reduced motion). Holds at 0 when off.
 */
export function useTakingTurns(enabled: boolean): Animated.Value {
  const turn = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!enabled) {
      turn.setValue(0);
      return;
    }
    const fade = (toValue: number) =>
      Animated.timing(turn, {
        toValue,
        duration: reduced ? 0 : SOURCE_TURN.fadeMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    let back: ReturnType<typeof setTimeout> | undefined;
    const every = setInterval(() => {
      fade(1);
      back = setTimeout(() => fade(0), SOURCE_TURN.showMs);
    }, SOURCE_TURN.everyMs);
    return () => {
      clearInterval(every);
      if (back !== undefined) clearTimeout(back);
      turn.stopAnimation();
      turn.setValue(0);
    };
  }, [enabled, reduced, turn]);
  return turn;
}

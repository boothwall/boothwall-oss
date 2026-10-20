import { useEffect, useMemo } from "react";
import { Animated, Easing } from "react-native";

import { NATIVE_DRIVER } from "#platform/motion";
import { useReducedMotion } from "#platform/motion";

import { CARD_REACH, type SlotDrift } from "../constants/layout";
import { CARD_DRIFT_MS, CARD_DRIFT_STEP_MS } from "../constants/timing";

/** Where a drift loop starts and rests (reduced motion): its middle, so no offset. */
const REST = 0.5;

/**
 * Each slot's slow float up and down, on its own period so neighbours never move in lockstep.
 * Owned above the cards so every copy of a slot's photo (the resting card, the lifted copy, the
 * spotlight's fly-out) shares the same offset: a selection never jumps by the float. It never
 * pauses, so a hidden card comes back exactly where its copy settles. Reduced motion holds it still.
 */
export function useSlotDrift(count: number): readonly SlotDrift[] {
  const reduced = useReducedMotion();
  const values = useMemo(() => Array.from({ length: count }, () => new Animated.Value(0)), [count]);
  // Built once per value: recreating animated nodes on re-render makes native-driven motion jump.
  const drifts = useMemo(
    () =>
      values.map((value) =>
        value.interpolate({
          inputRange: [0, 1],
          outputRange: [-CARD_REACH.driftY, CARD_REACH.driftY],
        }),
      ),
    [values],
  );

  useEffect(() => {
    if (reduced) {
      values.forEach((value) => value.setValue(REST));
      return;
    }
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER };
    const loops = values.map((value, index) => {
      const halfMs = CARD_DRIFT_MS + index * CARD_DRIFT_STEP_MS;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: halfMs, ...ease }),
          Animated.timing(value, { toValue: 0, duration: halfMs, ...ease }),
        ]),
      );
    });
    // A loop replays its first cycle from the value it started at (natively too), so each cycle
    // must start where it ends: from 0, up to 1 and back. Starting mid-way made every card snap
    // by half its float once a cycle, one card after another.
    values.forEach((value) => value.setValue(0));
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [reduced, values]);

  return drifts;
}

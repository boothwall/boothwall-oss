import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

import { ANNOUNCEMENT_CUE, ANNOUNCEMENT_ENTER_MS } from "#features/wall/constants/timing";
import { NATIVE_DRIVER } from "#foundation/motion";

/**
 * The filled announcement's cue: a value that runs 0 → 1 once the announcement has risen into
 * place, then again every minute. At 1 every part is back at rest, so it simply waits there.
 */
export function useAnnouncementCue() {
  const cue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const { durationMs, everyMs } = ANNOUNCEMENT_CUE;
    const step = { easing: Easing.linear, useNativeDriver: NATIVE_DRIVER };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cue, { toValue: 0, duration: 0, ...step }),
        Animated.timing(cue, { toValue: 1, duration: durationMs, ...step }),
        Animated.timing(cue, { toValue: 1, duration: everyMs - durationMs, ...step }),
      ]),
    );
    const timer = setTimeout(() => loop.start(), ANNOUNCEMENT_ENTER_MS);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [cue]);
  return cue;
}

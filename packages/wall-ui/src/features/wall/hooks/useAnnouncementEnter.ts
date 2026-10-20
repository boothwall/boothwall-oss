import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";

import { ANNOUNCEMENT_ENTER_MS } from "#features/wall/constants/timing";
import { NATIVE_DRIVER } from "#foundation/motion";
import { space } from "#foundation/tokens";

/** An announcement rising into place as it mounts, or only fading in with reduced motion. */
export function useAnnouncementEnter(reduced: boolean) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: ANNOUNCEMENT_ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [enter]);
  return useMemo(
    () => ({
      opacity: enter,
      rise: enter.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : space.md, 0] }),
    }),
    [enter, reduced],
  );
}

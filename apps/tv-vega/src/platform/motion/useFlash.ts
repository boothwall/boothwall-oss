import { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";

export const FLASH_FADE_MS = { in: 180, out: 300 } as const;

/** Fades in, holds, fades out: each time `trigger` changes to something truthy. */
export function useFlash(trigger: number | boolean, holdMs: number, onDone?: () => void) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!trigger) return;
    opacity.setValue(0);
    const run = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: FLASH_FADE_MS.in, useNativeDriver: true }),
      Animated.delay(holdMs),
      Animated.timing(opacity, { toValue: 0, duration: FLASH_FADE_MS.out, useNativeDriver: true }),
    ]);
    run.start(({ finished }) => finished && done.current?.());
    return () => run.stop();
  }, [holdMs, opacity, trigger]);

  return opacity;
}

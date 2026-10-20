import React, { memo, useMemo } from "react";
import { Animated, Easing, type ImageSourcePropType, StyleSheet } from "react-native";

import { cornerPivot } from "#features/wall/utils/signalPath";
import { useOneShot } from "#foundation/motion";
import type { SignalSweep } from "#foundation/tokens";

const EASE_IN_OUT = Easing.inOut(Easing.cubic);

/** A soft band crossing its parent once at an angle, fading in and out. Not drawn with reduced motion. */
export const SweepBand = memo(function SweepBand({
  source,
  sweep,
}: {
  source: ImageSourcePropType;
  sweep: SignalSweep;
}) {
  const { width, height, top, from, to, angle, peak, durationMs, delayMs, hold } = sweep;
  const { value, reduced } = useOneShot(durationMs, { delayMs, easing: EASE_IN_OUT });
  const style = useMemo(() => {
    const [dx, dy] = cornerPivot(width, height, angle);
    return {
      height,
      top: top + dy,
      width,
      opacity: value.interpolate({
        inputRange: [0, hold[0], hold[1], 1],
        outputRange: [0, peak, peak, 0],
      }),
      transform: [
        {
          translateX: value.interpolate({ inputRange: [0, 1], outputRange: [from + dx, to + dx] }),
        },
        { rotate: `${angle}deg` },
      ],
    };
  }, [angle, from, height, hold, peak, to, top, value, width]);
  if (reduced) return null;
  return (
    <Animated.Image
      source={source}
      style={[styles.band, style]}
      resizeMode="stretch"
      accessible={false}
    />
  );
});

const styles = StyleSheet.create({ band: { left: 0, opacity: 0, position: "absolute" } });

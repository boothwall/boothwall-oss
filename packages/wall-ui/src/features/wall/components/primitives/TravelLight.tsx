import React, { memo, useMemo } from "react";
import { Animated, Easing, Image, type ImageSourcePropType, StyleSheet } from "react-native";

import { pathFrames, type Point } from "#features/wall/utils/signalPath";
import { useOneShot } from "#foundation/motion";

export type TravelLightProps = {
  points: readonly Point[];
  durationMs: number;
  delayMs: number;
  /** Its opacity in full flight. */
  peak: number;
  head: { source: ImageSourcePropType; size: number };
  /** Drawn behind the head, reaching back `length` and tucked `overlap` under it. */
  tail: { source: ImageSourcePropType; length: number; height: number; overlap: number };
};

const EASE_IN_OUT = Easing.inOut(Easing.cubic);

/**
 * A light travelling once along a path: a glowing head with a tail that turns with the path. One
 * native value drives position and heading through the path's points. Not drawn with reduced motion.
 */
export const TravelLight = memo(function TravelLight({
  points,
  durationMs,
  delayMs,
  peak,
  head,
  tail,
}: TravelLightProps) {
  const { value, reduced } = useOneShot(durationMs, { delayMs, easing: EASE_IN_OUT });
  // A box twice the tail long, centred on the head: React Native turns a view about its middle.
  const box = tail.length * 2;
  const style = useMemo(() => {
    const { input, x, y, angles } = pathFrames(points);
    const along = (outputRange: number[]) => value.interpolate({ inputRange: input, outputRange });
    return {
      height: box,
      left: -box / 2,
      top: -box / 2,
      width: box,
      opacity: value.interpolate({
        inputRange: [0, 0.06, 0.94, 1],
        outputRange: [0, peak, peak, 0],
      }),
      transform: [
        { translateX: along(x) },
        { translateY: along(y) },
        { rotate: value.interpolate({ inputRange: input, outputRange: angles }) },
      ],
    };
  }, [box, peak, points, value]);
  const parts = useMemo(
    () => ({
      head: {
        height: head.size,
        left: (box - head.size) / 2,
        top: (box - head.size) / 2,
        width: head.size,
      },
      tail: {
        height: tail.height,
        left: box / 2 - tail.length + tail.overlap,
        top: (box - tail.height) / 2,
        width: tail.length,
      },
    }),
    [box, head.size, tail.height, tail.length, tail.overlap],
  );
  if (reduced) return null;
  return (
    <Animated.View style={[styles.mover, style]} pointerEvents="none">
      <Image
        source={tail.source}
        style={[styles.part, parts.tail]}
        resizeMode="stretch"
        accessible={false}
      />
      <Image
        source={head.source}
        style={[styles.part, parts.head]}
        resizeMode="stretch"
        accessible={false}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  mover: { opacity: 0, position: "absolute" },
  part: { position: "absolute" },
});

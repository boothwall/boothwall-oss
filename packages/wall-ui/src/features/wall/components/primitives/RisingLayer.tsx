import React, { memo, useMemo } from "react";
import { Animated, Image, type ImageSourcePropType, StyleSheet } from "react-native";

import { useFlow } from "#foundation/motion";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "#foundation/tokens";

export type RisingLayerProps = {
  /** A full-canvas tile of particles that repeats seamlessly bottom to top. */
  source: ImageSourcePropType;
  periodMs: number;
  opacity: number;
  phase: number;
  paused: boolean;
};

/**
 * Particles rising forever: the tile twice, one under the other, sliding up one canvas height
 * per period, like FallingLayer upside down. One native translate.
 */
export const RisingLayer = memo(function RisingLayer({
  source,
  periodMs,
  opacity,
  phase,
  paused,
}: RisingLayerProps) {
  const flow = useFlow(periodMs, { phase, paused });
  const style = useMemo(
    () => ({
      opacity,
      transform: [
        { translateY: flow.interpolate({ inputRange: [0, 1], outputRange: [0, -CANVAS_HEIGHT] }) },
      ],
    }),
    [flow, opacity],
  );
  return (
    <Animated.View
      style={[styles.column, style]}
      pointerEvents="none"
      testID="wall-signal-particles"
    >
      <Image source={source} style={styles.tile} resizeMode="stretch" accessible={false} />
      <Image source={source} style={styles.tile} resizeMode="stretch" accessible={false} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  column: {
    height: CANVAS_HEIGHT * 2,
    left: 0,
    position: "absolute",
    top: 0,
    width: CANVAS_WIDTH,
  },
  tile: { height: CANVAS_HEIGHT, width: CANVAS_WIDTH },
});

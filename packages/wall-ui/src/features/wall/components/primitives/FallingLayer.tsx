import React, { memo, useMemo } from "react";
import { Animated, Image, type ImageSourcePropType, StyleSheet } from "react-native";

import { useCycle } from "#platform/motion";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "#theme/tokens";

export type FallingLayerProps = {
  /** A full-canvas tile of pieces (petals, confetti) that repeats seamlessly top to bottom. */
  source: ImageSourcePropType;
  /** One full fall, top to bottom. */
  periodMs: number;
};

/**
 * Pieces drifting down forever: the same tile twice, one above the other, sliding down one
 * canvas height per cycle, so the top copy takes over where the bottom one leaves. One native
 * translate: the Stick moves a texture and draws nothing new.
 */
export const FallingLayer = memo(function FallingLayer({ source, periodMs }: FallingLayerProps) {
  const fall = useCycle(periodMs);
  // Built once: a new animated node on each render makes native-driven motion jump.
  const style = useMemo(
    () => ({
      transform: [
        { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-CANVAS_HEIGHT, 0] }) },
      ],
    }),
    [fall],
  );
  return (
    <Animated.View style={[styles.column, style]} pointerEvents="none">
      <Image source={source} style={styles.tile} accessible={false} />
      <Image source={source} style={styles.tile} accessible={false} />
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
  tile: {
    height: CANVAS_HEIGHT,
    width: CANVAS_WIDTH,
  },
});

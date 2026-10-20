import React, { memo, useMemo } from "react";
import { Animated, Image, type ImageSourcePropType, StyleSheet, View } from "react-native";

import { useLoop } from "#platform/motion";

export type SweepingBeamProps = {
  /** A light cone drawn from its fixture at the top centre of the image. */
  source: ImageSourcePropType;
  /** The fixture, in dp on the canvas. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** How far it swings each side of straight down, in degrees, and how long one swing takes. */
  swing: number;
  halfMs: number;
};

/**
 * A spotlight swinging slowly from its fixture. React Native turns a view about its centre, so
 * the beam hangs from the middle of a box twice its height: turning the box swings the beam
 * about the fixture. One native-driven rotation.
 */
export const SweepingBeam = memo(function SweepingBeam({
  source,
  x,
  y,
  width,
  height,
  swing,
  halfMs,
}: SweepingBeamProps) {
  const sway = useLoop(halfMs, { rest: 0.5 });
  // Built once: a new animated node on each render makes native-driven motion jump.
  const style = useMemo(
    () => ({
      transform: [
        {
          rotate: sway.interpolate({
            inputRange: [0, 1],
            outputRange: [`${-swing}deg`, `${swing}deg`],
          }),
        },
      ],
    }),
    [sway, swing],
  );
  const frame = useMemo(
    () => ({
      box: { left: x - width / 2, top: y - height, width, height: height * 2 },
      spacer: { height },
      beam: { width, height },
    }),
    [x, y, width, height],
  );
  return (
    <Animated.View style={[styles.box, frame.box, style]} pointerEvents="none">
      <View style={frame.spacer} />
      <Image source={source} style={frame.beam} resizeMode="stretch" accessible={false} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  box: {
    position: "absolute",
  },
});

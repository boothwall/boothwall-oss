import React, { memo, useMemo } from "react";
import { Animated, StyleSheet } from "react-native";

import { useLoop } from "#platform/motion";
import { THEME_LAYERS } from "#theme/themeArt";
import { CANVAS_WIDTH, decor } from "#theme/tokens";

import { FallingLayer } from "../primitives/FallingLayer";

const { lights, petals } = THEME_LAYERS.wedding;

/** The fairy lights along the top glowing softly up and down, and petals drifting down. */
export const WeddingDecor = memo(function WeddingDecor() {
  const glow = useLoop(decor.lights.halfMs, { rest: 1 });
  // Built once: a new animated node on each render makes native-driven motion jump.
  const style = useMemo(
    () => ({
      opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [decor.lights.low, 1] }),
    }),
    [glow],
  );
  return (
    <>
      <Animated.Image
        source={lights}
        style={[styles.lights, style]}
        resizeMode="stretch"
        accessible={false}
      />
      <FallingLayer source={petals} periodMs={decor.petalsFallMs} />
    </>
  );
});

const styles = StyleSheet.create({
  lights: {
    height: decor.lights.height,
    left: 0,
    position: "absolute",
    top: 0,
    width: CANVAS_WIDTH,
  },
});

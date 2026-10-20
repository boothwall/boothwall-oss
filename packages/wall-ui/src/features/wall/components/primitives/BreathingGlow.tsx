import React, { useMemo } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";

import { JOIN_GLOW } from "#features/wall/constants/timing";
import { useLoop } from "#platform/motion";
import { radius, size } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

/**
 * A soft accent ring and halo around the join card that breathe slowly, so the one thing guests
 * act on keeps drawing the eye without shouting. Drawn outside the card, so it adds no size; one
 * native-driven opacity, so it costs the Stick next to nothing. With reduced motion it stays lit.
 */
export function BreathingGlow() {
  const breath = useLoop(JOIN_GLOW.halfMs, { rest: 1 });
  // Built once: a new animated node on each render makes native-driven motion jump.
  const style = useMemo(
    () => ({
      opacity: breath.interpolate({
        inputRange: [0, 1],
        outputRange: [JOIN_GLOW.low, JOIN_GLOW.high],
      }),
    }),
    [breath],
  );
  return <AccentRings corner={radius.card} style={style} />;
}

export type AccentRingsProps = {
  /** The corner radius of the box they surround. */
  corner: number;
  /** Their opacity, usually animated. */
  style?: Animated.WithAnimatedValue<ViewStyle>;
};

/**
 * Two flat accent rings around a box: a thin glow on its edge and a wider halo just outside.
 * Drawn outside the box, so they add no size, and without blur, which the Stick can't afford.
 */
export function AccentRings({ corner, style }: AccentRingsProps) {
  const tint = useThemedStyles(themed);
  const shape = useMemo(
    () => ({
      glow: { borderRadius: corner + size.joinGlowStroke },
      halo: { borderRadius: corner + size.joinHaloReach },
    }),
    [corner],
  );
  return (
    <Animated.View style={[styles.glow, shape.glow, tint.glow, style]} pointerEvents="none">
      <View style={[styles.halo, shape.halo, tint.halo]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    borderWidth: size.joinGlowStroke,
    bottom: -size.joinGlowStroke,
    left: -size.joinGlowStroke,
    position: "absolute",
    right: -size.joinGlowStroke,
    top: -size.joinGlowStroke,
  },
  halo: {
    borderWidth: size.joinHaloReach - size.joinGlowStroke,
    bottom: -size.joinHaloReach,
    left: -size.joinHaloReach,
    position: "absolute",
    right: -size.joinHaloReach,
    top: -size.joinHaloReach,
  },
});

const themed = themedStyles((colors) =>
  StyleSheet.create({
    glow: { borderColor: colors.joinGlow },
    halo: { borderColor: colors.joinHalo },
  }),
);

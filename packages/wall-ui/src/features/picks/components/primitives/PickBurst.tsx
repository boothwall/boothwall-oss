import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { BURST } from "#features/picks/constants/motion";
import { NATIVE_DRIVER } from "#platform/motion";
import { useReducedMotion } from "#platform/motion";
import { color, fontSize } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

/** The angle of each spark, evenly round the badge. */
const ANGLES = Array.from({ length: BURST.sparks }, (_, i) => (i / BURST.sparks) * Math.PI * 2);

/** A one-off ring of sparks flying out of the badge. Nothing at all with reduced motion. */
export const PickBurst = memo(function PickBurst() {
  const tint = useThemedStyles(themed);
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: BURST.durationMs,
      delay: BURST.delayMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);

  const sparks = useMemo(
    () =>
      ANGLES.map((angle) => ({
        opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.cos(angle) * BURST.radiusX],
            }),
          },
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.sin(angle) * BURST.radiusY],
            }),
          },
        ],
      })),
    [progress],
  );

  if (reduced) return null;
  return (
    <View style={styles.root} pointerEvents="none">
      {sparks.map((style, index) => (
        <Animated.View key={index} style={[styles.spark, style]}>
          {/* Two colours that stand out from the badge's own. */}
          <Text style={[styles.glyph, index % 2 === 1 && tint.glyphAlt]}>✦</Text>
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  spark: {
    position: "absolute",
  },
  glyph: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
  },
});

/** Every other spark in the second accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    glyphAlt: { color: colors.brandSecondary },
  }),
);

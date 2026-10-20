import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { ARRIVAL_SPARK_MS } from "#features/wall/constants/timing";
import { NATIVE_DRIVER } from "#platform/motion";
import { useReducedMotion } from "#platform/motion";
import { radius, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

const { spark: SPARK, sparkRay: RAY, sparkStroke: THICK } = size;

/**
 * The logo's spark, once, at the top corner of a photo that just landed: four short accent rays
 * that open out and fade. Transform and opacity only; with reduced motion it isn't drawn.
 */
export const ArrivalSpark = memo(function ArrivalSpark({ delayMs = 0 }: { delayMs?: number }) {
  const tint = useThemedStyles(themed);
  const reduced = useReducedMotion();
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.timing(burst, {
      toValue: 1,
      duration: ARRIVAL_SPARK_MS,
      delay: delayMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [burst, delayMs, reduced]);
  const style = useMemo(
    () => ({
      opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
      transform: [
        { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.3] }) },
        { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "25deg"] }) },
      ],
    }),
    [burst],
  );
  if (reduced) return null;
  return (
    <Animated.View style={[styles.spark, style]} pointerEvents="none">
      <View style={[styles.ray, tint.ray, styles.vertical, styles.top]} />
      <View style={[styles.ray, tint.ray, styles.vertical, styles.bottom]} />
      <View style={[styles.ray, tint.ray, styles.horizontal, styles.left]} />
      <View style={[styles.ray, tint.ray, styles.horizontal, styles.right]} />
      <View style={[styles.core, tint.core]} />
    </Animated.View>
  );
});

const MID = (SPARK - THICK) / 2;

const styles = StyleSheet.create({
  spark: {
    height: SPARK,
    position: "absolute",
    right: -SPARK / 2,
    top: -SPARK / 2,
    width: SPARK,
  },
  ray: {
    borderRadius: radius.pill,
    position: "absolute",
  },
  vertical: { height: RAY, left: MID, width: THICK },
  horizontal: { height: THICK, top: MID, width: RAY },
  top: { top: 0 },
  bottom: { bottom: 0 },
  left: { left: 0 },
  right: { right: 0 },
  core: {
    borderRadius: radius.pill,
    height: space.xs + 1,
    left: (SPARK - space.xs - 1) / 2,
    position: "absolute",
    top: (SPARK - space.xs - 1) / 2,
    width: space.xs + 1,
  },
});

/** The spark's rays and core in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    ray: { backgroundColor: colors.brandPrimary },
    core: { backgroundColor: colors.brandPrimary },
  }),
);

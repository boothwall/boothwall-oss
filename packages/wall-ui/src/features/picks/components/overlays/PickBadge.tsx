import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { BURST } from "#features/picks/constants/motion";
import type { Pick } from "#features/picks/utils/choosePick";
import { NATIVE_DRIVER } from "#platform/motion";
import { useReducedMotion } from "#platform/motion";
import { color, fontSize, radius, scale, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { PickBurst } from "../primitives/PickBurst";

export type PickBadgeProps = { pick: Pick };

/**
 * The label over a picked photo in the spotlight: "Crowd favourite · 12 reactions" or "AI pick ·
 * Made for the big screen". It pops in with a small burst of sparks, unless motion is reduced.
 */
export const PickBadge = memo(function PickBadge({ pick }: PickBadgeProps) {
  const { picks: picksCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // With reduced motion the badge is simply there, with the photo.
    if (reduced) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    const animation = Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      delay: BURST.delayMs,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [pick.photo.id, pop, reduced]);
  const popStyle = useMemo(
    () => ({
      opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
      transform: [
        { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [scale.popStart, 1] }) },
      ],
    }),
    [pop],
  );
  const crowd = pick.kind === "crowd";
  return (
    <View style={styles.row}>
      <Animated.View style={[styles.badge, tint.badge, popStyle]}>
        <PickBurst key={pick.photo.id} />
        <Text style={[styles.label, tint.label]}>{crowd ? picksCopy.crowd : picksCopy.ai}</Text>
      </Animated.View>
      <Text style={styles.reason}>
        {crowd ? picksCopy.reactions(pick.reactions) : picksCopy.aiReason}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: "900",
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  reason: {
    color: color.textSecondary,
    fontSize: fontSize.body,
    fontWeight: "600",
  },
});

/** The badge's accent fill and the label on it. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    badge: { backgroundColor: colors.brandPrimary },
    label: { color: colors.onBrandPrimary },
  }),
);

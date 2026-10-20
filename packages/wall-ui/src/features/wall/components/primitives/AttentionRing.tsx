import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { ATTENTION_PULSE_MS } from "#features/wall/constants/timing";
import { useLoop } from "#platform/motion";
import { fontSize, fontWeight, radius, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

/** The empty wall's cue on the join card: a pulsing accent ring and a "Scan me" tag. */
export function AttentionRing() {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  // Pulses for attention; with reduced motion the ring just stays on.
  const pulse = useLoop(ATTENTION_PULSE_MS, { rest: 1 });

  return (
    <>
      <Animated.View
        style={[styles.attention, tint.attention, { opacity: pulse }]}
        pointerEvents="none"
      />
      <View style={[styles.scanMe, tint.scanMe]}>
        <Text style={[styles.scanMeText, tint.scanMeText]}>{wallCopy.empty.scanMe}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  attention: {
    borderRadius: radius.card + 2,
    borderWidth: size.focusRing,
    bottom: -size.focusRing,
    left: -size.focusRing,
    position: "absolute",
    right: -size.focusRing,
    top: -size.focusRing,
  },
  scanMe: {
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    position: "absolute",
    right: space.md,
    top: -space.sm - 2,
  },
  scanMeText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.black,
  },
});

const themed = themedStyles((colors) =>
  StyleSheet.create({
    attention: { borderColor: colors.brandPrimary },
    scanMe: { backgroundColor: colors.brandPrimary },
    scanMeText: { color: colors.onBrandPrimary },
  }),
);

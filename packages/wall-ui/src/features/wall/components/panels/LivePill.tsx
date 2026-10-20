import React, { useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { LIVE_PULSE } from "#features/wall/constants/timing";
import type { FeedStatus } from "#features/wall/state/connectionPhase";
import { useLoop } from "#platform/motion";
import { color, fontSize, fontWeight, radius, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

const dotColor: Record<FeedStatus, string> = {
  connecting: color.waiting,
  live: color.success,
  offline: color.danger,
  simulated: color.waiting,
};

export type LivePillProps = {
  status: FeedStatus;
  /** Said instead of the state's word (the offline notice); the dot still shows the state. */
  label?: string;
  /** Just the dot and the word, without the pill, as on the split header's second row. */
  inline?: boolean;
};

/**
 * "● Live" beside the count: the word says the state (Live, Connecting, Reconnecting, Demo), the
 * dot only backs it up. Live pulses softly, on the native driver; every other state holds still.
 */
export function LivePill({ status, label, inline = false }: LivePillProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const breath = useLoop(LIVE_PULSE.halfMs, { paused: status !== "live" });
  const pulse = useMemo(
    () => breath.interpolate({ inputRange: [0, 1], outputRange: [1, LIVE_PULSE.low] }),
    [breath],
  );
  const text = label ?? wallCopy.status[status];

  return (
    <View
      style={inline ? [styles.status, styles.inline] : [styles.status, styles.pill, tint.pill]}
      accessibilityRole="text"
      accessibilityLabel={text}
      accessibilityLiveRegion="polite"
      testID="status-pill"
    >
      <Animated.View style={[styles.dot, { backgroundColor: dotColor[status], opacity: pulse }]} />
      <Text style={[styles.label, inline && styles.inlineLabel]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  pill: {
    borderColor: color.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md - space.xs,
    paddingVertical: space.xs + 1,
  },
  inline: {
    gap: space.xs + 2,
  },
  inlineLabel: {
    fontSize: fontSize.body,
  },
  dot: {
    borderRadius: radius.pill,
    height: space.sm,
    width: space.sm,
  },
  label: {
    color: color.textPrimary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
});

/** The pill's theme surface. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    pill: { backgroundColor: colors.surface },
  }),
);

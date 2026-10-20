import React, { useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { EMPTY_WALL, type SlotPosition } from "#features/wall/constants/layout";
import { GHOST_DRIFT_MS, GHOST_DRIFT_STEP_MS } from "#features/wall/constants/timing";
import { useLoop } from "#platform/motion";
import { color, fontSize, fontWeight, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { TiltedSurface } from "../primitives/TiltedSurface";

/**
 * The wall before the first photo: three blank polaroids fanned in the middle of the stage and
 * one line under them. The join panel beside it already says how; this only says "you".
 */
export function EmptyWall() {
  const { wall: wallCopy } = useWallCopy();
  return (
    <>
      {EMPTY_WALL.ghosts.map((slot, index) => (
        <GhostCard key={index} slot={slot} index={index} />
      ))}
      <View style={styles.headline} pointerEvents="none">
        <Text style={styles.title}>{wallCopy.empty.title}</Text>
      </View>
    </>
  );
}

function GhostCard({ slot, index }: { slot: SlotPosition; index: number }) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const drift = useLoop(GHOST_DRIFT_MS + index * GHOST_DRIFT_STEP_MS);

  const style = useMemo(
    () => ({
      width: slot.width,
      opacity: drift.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.95] }),
      transform: [
        { translateX: slot.x },
        {
          translateY: Animated.add(
            drift.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }),
            slot.y,
          ),
        },
        {
          rotate: drift.interpolate({
            inputRange: [0, 1],
            outputRange: [`${slot.rotate - 1}deg`, `${slot.rotate + 1}deg`],
          }),
        },
      ],
    }),
    [drift, slot],
  );
  const image = slot.width - space.md;

  return (
    <TiltedSurface style={[styles.ghost, style]}>
      <View style={[styles.ghostImage, tint.ghostImage, { width: image, height: image }]}>
        <Text style={styles.ghostPlus}>+</Text>
      </View>
      <Text style={styles.ghostLabel}>{wallCopy.empty.ghost}</Text>
    </TiltedSurface>
  );
}

const styles = StyleSheet.create({
  headline: {
    alignItems: "center",
    left: EMPTY_WALL.headline.left,
    position: "absolute",
    top: EMPTY_WALL.headline.top,
    width: EMPTY_WALL.headline.width,
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.title,
    textAlign: "center",
  },
  ghost: {
    alignItems: "center",
    borderColor: color.textMuted,
    borderRadius: space.xs,
    borderStyle: "dashed",
    borderWidth: 2,
    left: 0,
    paddingBottom: space.md,
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
    position: "absolute",
    top: 0,
  },
  ghostImage: {
    marginBottom: space.sm,
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 2,
    justifyContent: "center",
  },
  ghostPlus: {
    color: color.textSecondary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.regular,
  },
  ghostLabel: {
    alignSelf: "center",
    color: color.textSecondary,
    fontSize: fontSize.lead,
    fontWeight: fontWeight.heavy,
  },
});

/** The blank photo area in the theme's surface. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    ghostImage: { backgroundColor: colors.surface },
  }),
);

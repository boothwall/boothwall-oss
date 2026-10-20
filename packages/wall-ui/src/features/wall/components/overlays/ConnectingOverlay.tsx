import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { CONNECTING_CARD_WIDTH } from "#features/wall/constants/layout";
import { CONNECTION_FADE_MS, SPINNER_TURN_MS } from "#features/wall/constants/timing";
import type { ConnectionPhase } from "#features/wall/state/connectionPhase";
import { useWallConnection } from "#platform/connection";
import { NATIVE_DRIVER } from "#platform/motion";
import { useLoop } from "#platform/motion";
import { color, fontSize, layer, radius, space } from "#theme/tokens";
import { themedStyles, useThemedStyles, useWallTheme } from "#theme/wallTheme";

export type ConnectingOverlayProps = {
  phase: ConnectionPhase;
  attempts: number;
};

/** Covers the empty wall until the first snapshot lands, so a slow start never reads as "no photos". */
export const ConnectingOverlay = memo(function ConnectingOverlay({
  phase,
  attempts,
}: ConnectingOverlayProps) {
  const { wall: wallCopy } = useWallCopy();
  const host = useWallConnection().apiBaseUrl.replace(/^https?:\/\//, "");
  const { colors } = useWallTheme();
  const tint = useThemedStyles(themed);
  const visible = phase !== "ready";
  const [mounted, setMounted] = useState(visible);
  const show = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: CONNECTION_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => finished && !visible && setMounted(false));
  }, [show, visible]);

  if (!mounted) return null;

  const failed = phase === "failed";
  return (
    <Animated.View style={[styles.overlay, tint.overlay, { opacity: show }]} pointerEvents="none">
      <View style={[styles.card, tint.card]} accessibilityLiveRegion="polite">
        <Spinner tone={failed ? color.warning : colors.brandPrimary} />
        <Text style={styles.title}>
          {failed
            ? wallCopy.connection.failedTitle
            : wallCopy.connection[phase === "loading" ? "loading" : "connecting"]}
        </Text>
        {failed ? (
          <>
            <Text style={styles.body}>{wallCopy.connection.failedBody}</Text>
            <Text
              style={styles.meta}
            >{`${host}  ·  ${wallCopy.connection.attempt(attempts)}`}</Text>
          </>
        ) : null}
      </View>
    </Animated.View>
  );
});

function Spinner({ tone }: { tone: string }) {
  const turn = useRef(new Animated.Value(0)).current;
  // The halo breathes; with reduced motion it holds still and only the arc turns (the arc is
  // the "still working" signal, so it keeps going, at a steady linear pace).
  const pulse = useLoop(SPINNER_TURN_MS, { rest: 0.5 });

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: SPINNER_TURN_MS,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [turn]);

  const arcStyle = useMemo(
    () => ({
      transform: [
        { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
      ],
    }),
    [turn],
  );
  const haloStyle = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }),
      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
    }),
    [pulse],
  );

  return (
    <View style={styles.spinner}>
      <Animated.View style={[styles.halo, { backgroundColor: tone }, haloStyle]} />
      <View style={styles.track} />
      <Animated.View
        style={[styles.arc, { borderTopColor: tone, borderRightColor: tone }, arcStyle]}
      />
      <View style={[styles.core, { backgroundColor: tone }]} />
    </View>
  );
}

const SPINNER = space["2xl"];
const RING = 3;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: layer.connecting,
  },
  card: {
    alignItems: "center",
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.sm + 2,
    maxWidth: CONNECTING_CARD_WIDTH,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  spinner: {
    alignItems: "center",
    height: SPINNER,
    justifyContent: "center",
    marginBottom: space.xs,
    width: SPINNER,
  },
  halo: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
  },
  track: {
    ...StyleSheet.absoluteFill,
    borderColor: color.border,
    borderRadius: radius.pill,
    borderWidth: RING,
  },
  arc: {
    ...StyleSheet.absoluteFill,
    borderBottomColor: color.transparent,
    borderLeftColor: color.transparent,
    borderRadius: radius.pill,
    borderWidth: RING,
  },
  core: {
    borderRadius: radius.pill,
    height: space.sm,
    width: space.sm,
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.body - 2,
    textAlign: "center",
  },
  meta: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
});

/** The theme's scrim over the wall and its canvas behind the card. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    overlay: { backgroundColor: colors.spotlightScrim },
    card: { backgroundColor: colors.canvas },
  }),
);

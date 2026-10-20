import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatCountdown } from "#features/photo-call/utils/photoCall.utils";
import { color, fontSize, fontWeight, photoCall, radius } from "#theme/tokens";

const { ring, ringDot, ringDots } = photoCall;
const RADIUS = (ring - ringDot) / 2;

/**
 * Dots around the time left, one per second, lit clockwise from the top. Round dots placed on a
 * circle need no rotated views, which Vega draws with jagged edges.
 */
export const CountdownRing = memo(function CountdownRing({
  secondsLeft,
  totalSeconds,
  accent,
}: {
  secondsLeft: number;
  totalSeconds: number;
  accent: string;
}) {
  const positions = useMemo(
    () =>
      Array.from({ length: ringDots }, (_, index) => {
        const angle = (index / ringDots) * 2 * Math.PI - Math.PI / 2;
        return { left: RADIUS + RADIUS * Math.cos(angle), top: RADIUS + RADIUS * Math.sin(angle) };
      }),
    [],
  );
  const lit = Math.ceil((secondsLeft / totalSeconds) * ringDots);

  return (
    <View style={styles.ring}>
      {positions.map((position, index) => (
        <View
          key={index}
          style={[styles.dot, position, { backgroundColor: index < lit ? accent : color.border }]}
        />
      ))}
      <Text style={styles.time}>{formatCountdown(secondsLeft)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  ring: { alignItems: "center", height: ring, justifyContent: "center", width: ring },
  dot: { borderRadius: radius.pill, height: ringDot, position: "absolute", width: ringDot },
  time: { color: color.textPrimary, fontSize: fontSize.heading, fontWeight: fontWeight.heavy },
});

import React, { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { NATIVE_DRIVER } from "#platform/motion";
import { color, remoteHint, size } from "#theme/tokens";

/** A thin accent line that runs out over `durationMs`, from the moment it mounts. */
export function CountdownLine({ durationMs, tint }: { durationMs: number; tint: string }) {
  const shift = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    const run = Animated.timing(shift, {
      toValue: -remoteHint.contentWidth,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: NATIVE_DRIVER,
    });
    run.start();
    return () => run.stop();
  }, [durationMs, shift]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[styles.fill, { backgroundColor: tint, transform: [{ translateX: shift }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: color.border,
    borderRadius: remoteHint.timerRadius,
    height: size.barTrack,
    marginTop: remoteHint.timerGap,
    overflow: "hidden",
    width: remoteHint.contentWidth,
  },
  fill: { height: size.barTrack, width: remoteHint.contentWidth },
});

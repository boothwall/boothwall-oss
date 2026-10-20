import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import { useWallCopy } from "#copy";
import { NATIVE_DRIVER } from "#platform/motion";
import { color, fontSize, layer, radius, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

export type ExitHintProps = { visible: boolean };

/** "Press Back again to exit", centred so nobody misses it. */
export const ExitHint = memo(function ExitHint({ visible }: ExitHintProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const show = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [show, visible]);

  const style = {
    opacity: show,
    transform: [{ scale: show.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
  };

  return (
    <Animated.View style={[styles.wrap, tint.wrap, style]} pointerEvents="none">
      <Text style={styles.text}>
        {wallCopy.exitHint.before}
        <Text style={[styles.key, tint.key]}>{wallCopy.exitHint.key}</Text>
        {wallCopy.exitHint.after}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    position: "absolute",
    top: "45%",
    zIndex: layer.exitHint,
  },
  text: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: "700",
  },
  key: {
    fontWeight: "900",
  },
});

/** The pill's canvas and accent edge, and the accent on the key's name. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    wrap: { backgroundColor: colors.canvas, borderColor: colors.brandPrimary },
    key: { color: colors.brandPrimaryText },
  }),
);

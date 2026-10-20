import React, { memo, useMemo } from "react";
import { Animated, type ImageSourcePropType, type ImageStyle, StyleSheet } from "react-native";

import { useOneShot } from "#foundation/motion";
import type { SignalPulse } from "#foundation/tokens";

export type PulseSpriteProps = {
  source: ImageSourcePropType;
  pulse: Omit<SignalPulse, "size">;
  /** Where it sits at scale 1 (see `centred`). */
  frame: ImageStyle;
};

/** A box of `width` × `height` dp centred on (x, y). */
export const centred = (x: number, y: number, width: number, height = width): ImageStyle => ({
  height,
  left: x - width / 2,
  top: y - height / 2,
  width,
});

/** A sprite that grows and fades once, from when it mounts. Not drawn with reduced motion. */
export const PulseSprite = memo(function PulseSprite({ source, pulse, frame }: PulseSpriteProps) {
  const { from, to, peak, durationMs, delayMs, rise = 0.12, rotate = 0 } = pulse;
  const { value, reduced } = useOneShot(durationMs, { delayMs });
  const style = useMemo(
    () => ({
      opacity: value.interpolate({ inputRange: [0, rise, 1], outputRange: [0, peak, 0] }),
      transform: [
        { scale: value.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) },
        {
          rotate: value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${rotate}deg`] }),
        },
      ],
    }),
    [from, peak, rise, rotate, to, value],
  );
  if (reduced) return null;
  return (
    <Animated.Image
      source={source}
      style={[styles.sprite, frame, style]}
      resizeMode="stretch"
      accessible={false}
    />
  );
});

const styles = StyleSheet.create({ sprite: { opacity: 0, position: "absolute" } });

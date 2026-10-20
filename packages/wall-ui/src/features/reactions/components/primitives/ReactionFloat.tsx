import { REACTION_EMOJI } from "@boothwall/shared";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import {
  FLOAT_KEYFRAMES,
  FLOAT_MS,
  FLOAT_RISE_DP,
  FLOAT_STAGGER_MS,
} from "#features/reactions/constants/motion";
import type { ReactionFloatSpec } from "#features/reactions/utils/reactionFloats";
import { NATIVE_DRIVER } from "#platform/motion";
import { fontSize, scale, size } from "#theme/tokens";

export type ReactionFloatProps = {
  float: ReactionFloatSpec;
  /** Fade in place instead of rising. */
  reducedMotion: boolean;
  onDone: (key: string) => void;
};

/** One emoji rising off a card and fading out; it reports back once it's gone. */
export const ReactionFloat = memo(function ReactionFloat({
  float,
  reducedMotion,
  onDone,
}: ReactionFloatProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FLOAT_MS,
      delay: float.order * FLOAT_STAGGER_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start(() => onDone(float.key));
    return () => animation.stop();
  }, [progress, float.key, float.order, onDone]);

  const motionStyle = useMemo(
    () => ({
      opacity: progress.interpolate({
        inputRange: [0, FLOAT_KEYFRAMES.shown, FLOAT_KEYFRAMES.fading, 1],
        outputRange: [0, 1, 1, 0],
      }),
      transform: reducedMotion
        ? []
        : [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -FLOAT_RISE_DP],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, FLOAT_KEYFRAMES.popped, 1],
                outputRange: [scale.popStart, scale.popPeak, 1],
              }),
            },
          ],
    }),
    [progress, reducedMotion],
  );

  return (
    <Animated.View
      style={[styles.float, { left: float.x - BOX / 2, top: float.y - BOX }, motionStyle]}
    >
      <Text style={styles.emoji}>{REACTION_EMOJI[float.reaction]}</Text>
    </Animated.View>
  );
});

const BOX = size.reactionBox;

const styles = StyleSheet.create({
  float: {
    alignItems: "center",
    height: BOX,
    justifyContent: "center",
    position: "absolute",
    width: BOX,
  },
  emoji: {
    fontSize: fontSize.reaction,
  },
});

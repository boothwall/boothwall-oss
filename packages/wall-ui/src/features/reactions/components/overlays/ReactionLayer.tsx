import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import {
  type ReactionTarget,
  useReactionFloats,
} from "#features/reactions/hooks/useReactionFloats";
import { useReducedMotion } from "#platform/motion";
import { layer } from "#theme/tokens";

import { ReactionFloat } from "../primitives/ReactionFloat";

export type ReactionLayerProps = {
  /** The photo cards on screen right now. */
  targets: ReactionTarget[];
};

/** Guests' reactions floating up over the photos they tapped, a few at a time. */
export const ReactionLayer = memo(function ReactionLayer({ targets }: ReactionLayerProps) {
  const reducedMotion = useReducedMotion();
  const { floats, finish } = useReactionFloats(targets);
  if (floats.length === 0) return null;
  return (
    <View style={styles.layer} pointerEvents="none" testID="reaction-layer">
      {floats.map((float) => (
        <ReactionFloat
          key={float.key}
          float={float}
          reducedMotion={reducedMotion}
          onDone={finish}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: layer.reactions,
  },
});

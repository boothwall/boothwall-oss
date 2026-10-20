import React, { memo, useMemo } from "react";
import { Animated, Image, type ImageSourcePropType, StyleSheet } from "react-native";

import { useFlow } from "#foundation/motion";
import { CANVAS_WIDTH, signal } from "#foundation/tokens";

const { tile: TILE } = signal;
const TILES = [0, 1, 2];

export type FlowingRibbonProps = {
  /** One seamless tile of the ribbon, left to right. */
  source: ImageSourcePropType;
  /** The band's middle, how far it tilts (degrees) and how tall it is, in dp. */
  cy: number;
  angle: number;
  height: number;
  /** One tile's slide. */
  periodMs: number;
  phase: number;
  opacity: number | Animated.AnimatedInterpolation<number>;
  flip?: boolean;
  paused: boolean;
};

/**
 * A light ribbon flowing left to right behind the wall: three copies of one tile in a strip,
 * tilted, sliding one tile per period. One native translate; the tilt never changes.
 */
export const FlowingRibbon = memo(function FlowingRibbon({
  source,
  cy,
  angle,
  height,
  periodMs,
  phase,
  opacity,
  flip = false,
  paused,
}: FlowingRibbonProps) {
  const flow = useFlow(periodMs, { phase, paused });
  const band = useMemo(
    () => ({ height, opacity, top: cy - height / 2, transform: [{ rotate: `${angle}deg` }] }),
    [angle, cy, height, opacity],
  );
  const strip = useMemo(
    () => ({
      height,
      transform: [
        { translateX: flow.interpolate({ inputRange: [0, 1], outputRange: [-TILE, 0] }) },
        { scaleY: flip ? -1 : 1 },
      ],
    }),
    [flip, flow, height],
  );
  const tile = useMemo(() => ({ height, width: TILE }), [height]);
  return (
    <Animated.View style={[styles.band, band]} pointerEvents="none" testID="wall-signal-ribbon">
      <Animated.View style={[styles.strip, strip]}>
        {TILES.map((index) => (
          <Image
            key={index}
            source={source}
            style={[styles.tile, tile, { left: index * TILE }]}
            resizeMode="stretch"
            accessible={false}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  // Three tiles wide and centred on the canvas, so the tilted band still covers its corners.
  band: { left: (CANVAS_WIDTH - TILE * 3) / 2, position: "absolute", width: TILE * 3 },
  strip: { left: 0, position: "absolute", top: 0, width: TILE * 3 },
  tile: { position: "absolute", top: 0 },
});

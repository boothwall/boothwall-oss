import React, { memo, useMemo } from "react";
import { Easing, StyleSheet, View } from "react-native";

import { SIGNAL_ART } from "#features/wall/constants/signalArt";
import { useOneShot } from "#foundation/motion";
import { CANVAS_HEIGHT, CANVAS_WIDTH, signal, signalIntensity } from "#foundation/tokens";

import { FlowingRibbon } from "../primitives/FlowingRibbon";
import { RisingLayer } from "../primitives/RisingLayer";

export type SignalDecorProps = {
  /** Changes on every slideshow step: the orange ribbon swells. */
  beat?: string;
  /** The slideshow is paused: everything holds where it is. */
  paused?: boolean;
};

const { ribbons, particles, swell } = signal;
const PARTICLE_ART = { far: SIGNAL_ART.particlesFar, near: SIGNAL_ART.particlesNear };
/** Far particles behind the ribbons, near ones over them. */
const behind = signalIntensity.particles.filter((layer) => layer === "far");
const over = signalIntensity.particles.filter((layer) => layer === "near");
const SWELL_EASE = Easing.bezier(0, 0, 0.58, 1);

/**
 * The signal look behind the photos: three faint light ribbons flowing slowly up and to the
 * right among rising particles, a calm layer that never competes with the photos. Each layer is
 * one native transform; with reduced motion they hold still in this arrangement.
 */
export const SignalDecor = memo(function SignalDecor({ beat, paused = false }: SignalDecorProps) {
  const { value } = useOneShot(swell.durationMs, { easing: SWELL_EASE, replay: beat });
  const swelling = useMemo(
    () => value.interpolate({ inputRange: [...swell.steps], outputRange: [...swell.opacity] }),
    [value],
  );
  return (
    <View style={styles.layer} pointerEvents="none" testID="wall-signal-decor">
      {behind.map((layer) => (
        <RisingLayer
          key={layer}
          source={PARTICLE_ART[layer]}
          {...particles[layer]}
          paused={paused}
        />
      ))}
      <FlowingRibbon source={SIGNAL_ART.ribbonBlue} {...ribbons.blue} paused={paused} />
      <FlowingRibbon
        source={SIGNAL_ART.ribbonOrange}
        {...ribbons.orange}
        opacity={swelling}
        paused={paused}
      />
      <FlowingRibbon source={SIGNAL_ART.ribbonOrange} {...ribbons.floor} paused={paused} />
      {over.map((layer) => (
        <RisingLayer
          key={layer}
          source={PARTICLE_ART[layer]}
          {...particles[layer]}
          paused={paused}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: { height: CANVAS_HEIGHT, left: 0, position: "absolute", top: 0, width: CANVAS_WIDTH },
});

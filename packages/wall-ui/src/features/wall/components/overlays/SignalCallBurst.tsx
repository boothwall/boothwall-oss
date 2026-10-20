import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { STAGE } from "#features/wall/constants/layout";
import { SIGNAL_ART } from "#features/wall/constants/signalArt";
import { CANVAS_HEIGHT, CANVAS_WIDTH, signal } from "#foundation/tokens";

import { centred, PulseSprite } from "../primitives/PulseSprite";

const { flash, rings, bursts, lifeMs } = signal.call;
const STAGE_CENTRE = [(STAGE.left + STAGE.right) / 2, (STAGE.top + STAGE.bottom) / 2] as const;
const [CX, CY] = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2];

/**
 * The signal look's photo call opening, for a host that runs photo calls over the wall: a flash
 * on the stage, three rings rippling out from the middle and two particle bursts. Plays once
 * when it mounts, then leaves; draw it above the photo call's screen.
 */
export const SignalCallBurst = memo(function SignalCallBurst() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), lifeMs);
    return () => clearTimeout(timer);
  }, []);
  if (done) return null;
  return (
    <View style={styles.layer} pointerEvents="none" testID="wall-signal-call">
      <PulseSprite
        source={SIGNAL_ART.glowWhite}
        pulse={flash}
        frame={centred(STAGE_CENTRE[0], STAGE_CENTRE[1], flash.size)}
      />
      {rings.map((ring) => (
        <PulseSprite
          key={ring.delayMs}
          source={SIGNAL_ART.ring}
          pulse={ring}
          frame={centred(CX, CY, ring.size)}
        />
      ))}
      {bursts.map((burst) => (
        <PulseSprite
          key={burst.delayMs}
          source={SIGNAL_ART.burst}
          pulse={burst}
          frame={centred(CX, CY, burst.size)}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
});

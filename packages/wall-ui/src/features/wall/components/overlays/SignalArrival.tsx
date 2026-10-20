import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { SlotDrift, SlotPosition } from "#features/wall/constants/layout";
import { SIGNAL_ART } from "#features/wall/constants/signalArt";
import { metaLineExtent, polaroidHeight } from "#features/wall/utils/polaroidGeometry";
import { SIGNAL_SOURCE, slotCentre, wavePath } from "#features/wall/utils/signalPath";
import { useOneShot } from "#foundation/motion";
import { color, signal, space } from "#foundation/tokens";

import { centred, PulseSprite } from "../primitives/PulseSprite";
import { TiltedSurface } from "../primitives/TiltedSurface";
import { TravelLight } from "../primitives/TravelLight";

const { travel, head, tail, glow, rings, develop } = signal.arrival;

export type SignalArrivalProps = { slot: SlotPosition; drift?: SlotDrift };

/**
 * A new photo's signal: a faint light rides a wave from the join card to the photo's card, which
 * lands in a soft blue glow and ripple while its paper flashes white, as if developing.
 */
export const SignalArrival = memo(function SignalArrival({ slot, drift }: SignalArrivalProps) {
  const [x, y] = slotCentre(slot);
  const path = useMemo(
    () => wavePath(SIGNAL_SOURCE, [x, y], travel.amplitude, travel.waves, travel.points),
    [x, y],
  );
  return (
    <>
      <TravelLight
        points={path}
        durationMs={travel.durationMs}
        delayMs={travel.delayMs}
        peak={travel.peak}
        head={{ source: SIGNAL_ART.glowBlue, size: head }}
        tail={{ source: SIGNAL_ART.streakBlue, ...tail }}
      />
      <DevelopFlash slot={slot} drift={drift} />
      <PulseSprite source={SIGNAL_ART.glowBlue} pulse={glow} frame={centred(x, y, glow.size)} />
      {rings.map((ring) => (
        <PulseSprite
          key={ring.delayMs}
          source={SIGNAL_ART.ring}
          pulse={ring}
          frame={centred(x, y, ring.size)}
        />
      ))}
    </>
  );
});

/** The card's paper flashing white and fading, over the card where it rests. */
function DevelopFlash({ slot, drift }: SignalArrivalProps) {
  const { value, reduced } = useOneShot(develop.durationMs, { delayMs: develop.delayMs });
  const style = useMemo(
    () => ({
      opacity: value.interpolate({
        inputRange: [0, develop.rise, 1],
        outputRange: [0, develop.peak, 0],
      }),
      transform: [{ translateX: slot.x }, { translateY: slot.y }, { rotate: `${slot.rotate}deg` }],
    }),
    [slot, value],
  );
  const paper = useMemo(
    () => ({ height: polaroidHeight(slot.width) - metaLineExtent(slot.width), width: slot.width }),
    [slot.width],
  );
  if (reduced) return null;
  return (
    <TiltedSurface style={[styles.flash, style]} drift={drift} pointerEvents="none">
      <View style={[styles.paper, paper]} />
    </TiltedSurface>
  );
}

const styles = StyleSheet.create({
  flash: { left: 0, opacity: 0, position: "absolute", top: 0 },
  paper: { backgroundColor: color.paper, borderRadius: space.xs },
});

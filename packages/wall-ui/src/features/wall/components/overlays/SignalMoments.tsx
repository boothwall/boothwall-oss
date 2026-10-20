import React, { memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import type { SlotDrift, SlotPosition } from "#features/wall/constants/layout";
import { SIGNAL_ART } from "#features/wall/constants/signalArt";
import { useShots } from "#features/wall/hooks/useShots";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import type { WallState } from "#features/wall/state/wallState";
import { CANVAS_HEIGHT, CANVAS_WIDTH, layer, signal } from "#foundation/tokens";

import { SweepBand } from "../primitives/SweepBand";
import { SignalArrival, type SignalArrivalProps } from "./SignalArrival";

export type SignalMomentsProps = {
  wall: WallState;
  positions: readonly SlotPosition[];
  drifts: readonly SlotDrift[];
};

/** The signal look's one-off lights over the photos: a new photo's arrival and the page turn. */
export function SignalMoments(props: SignalMomentsProps) {
  return useWallLook().motion === "signal" ? <SignalMomentsLayer {...props} /> : null;
}

const SignalMomentsLayer = memo(function SignalMomentsLayer({
  wall,
  positions,
  drifts,
}: SignalMomentsProps) {
  const [arrivals, arrive] = useShots<SignalArrivalProps>(signal.arrival.lifeMs);
  const [turns, turn] = useShots<number>(signal.pageTurn.lifeMs);
  // A photo is new once: when it joins `fresh` (it arrived live and has its slot already).
  const seen = useRef(new Set(wall.fresh));
  useEffect(() => {
    for (const id of wall.fresh) {
      const index = wall.slots.indexOf(id);
      const slot = positions[index];
      if (!seen.current.has(id) && slot) arrive({ slot, drift: drifts[index] });
    }
    seen.current = new Set(wall.fresh);
  }, [arrive, drifts, positions, wall.fresh, wall.slots]);
  const lastTurn = useRef(wall.turn);
  useEffect(() => {
    if (wall.turn === lastTurn.current) return;
    lastTurn.current = wall.turn;
    turn(wall.turn);
  }, [turn, wall.turn]);

  return (
    <View style={styles.layer} pointerEvents="none" testID="wall-signal-moments">
      {arrivals.map(({ key, value }) => (
        <SignalArrival key={key} slot={value.slot} drift={value.drift} />
      ))}
      {turns.map(({ key }) => (
        <SweepBand key={key} source={SIGNAL_ART.glowOrange} sweep={signal.pageTurn.sweep} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    height: CANVAS_HEIGHT,
    left: 0,
    position: "absolute",
    top: 0,
    width: CANVAS_WIDTH,
    zIndex: layer.motion,
  },
});

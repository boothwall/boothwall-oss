import type { PhotoDTO, WallStatsDTO } from "@boothwall/shared";
import React, { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useTakingTurns } from "#features/wall/hooks/useTakingTurns";

import { SourceCard } from "./SourceCard";
import { WhoIsHere } from "./WhoIsHere";

type InfoSlotProps = {
  stats: WallStatsDTO;
  pool: readonly PhotoDTO[];
  whoIsHere: boolean;
  source: boolean;
};

/**
 * The panel's foot: Who's here, which hands its place to the source card for a few seconds every
 * half minute (useTakingTurns), crossfading; either one alone when the other is off.
 */
export function InfoSlot({ stats, pool, whoIsHere, source }: InfoSlotProps) {
  const turn = useTakingTurns(whoIsHere && source);
  // Built once per value: a new animated node on each render makes native-driven motion jump.
  const whoStyle = useMemo(
    () => ({ opacity: turn.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }),
    [turn],
  );
  if (!whoIsHere) return source ? <SourceCard /> : null;
  if (!source) return <WhoIsHere stats={stats} pool={pool} />;
  return (
    <View>
      <Animated.View style={whoStyle}>
        <WhoIsHere stats={stats} pool={pool} />
      </Animated.View>
      <Animated.View style={[styles.turn, { opacity: turn }]}>
        <SourceCard style={styles.fill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The source card over Who's here, the same size, while it takes its turn.
  turn: {
    ...StyleSheet.absoluteFill,
  },
  fill: {
    flex: 1,
  },
});

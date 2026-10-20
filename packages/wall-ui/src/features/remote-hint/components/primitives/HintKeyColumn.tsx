import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  type HintKeys,
  remoteHintCopy,
} from "#features/remote-hint/constants/remoteHint.constants";
import { color, fontWeight, remoteHint } from "#theme/tokens";

import { KeyCap } from "./KeyCap";

/** A row's keys: one cap, OK held, or both arrows. */
export function HintKeyColumn({ keys, tint }: { keys: HintKeys; tint: string }) {
  if (keys === "holdOk")
    return (
      <View style={styles.column}>
        <Text style={styles.hold}>{remoteHintCopy.hold}</Text>
        <KeyCap glyph="ok" tint={tint} />
      </View>
    );
  if (keys === "arrows")
    return (
      <View style={[styles.column, styles.caps]}>
        <KeyCap glyph="left" tint={tint} />
        <KeyCap glyph="right" tint={tint} />
      </View>
    );
  return (
    <View style={styles.column}>
      <KeyCap glyph={keys} tint={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: "center", flexDirection: "row", width: remoteHint.keyColumn },
  caps: { gap: remoteHint.keysGap },
  hold: {
    color: color.textSecondary,
    fontSize: remoteHint.label,
    fontWeight: fontWeight.semibold,
    marginRight: remoteHint.holdGap,
  },
});

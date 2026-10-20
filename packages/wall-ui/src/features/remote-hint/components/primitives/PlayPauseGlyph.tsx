import React from "react";
import { StyleSheet, View } from "react-native";

import { color, keyGlyph } from "#theme/tokens";

const { playPause } = keyGlyph;

/** ⏯ drawn rather than typed, so it never depends on the system font having the glyph. */
export function PlayPauseGlyph({ tint }: { tint: string }) {
  return (
    <View style={styles.glyph}>
      <View style={[styles.play, { borderLeftColor: tint }]} />
      <View style={[styles.bar, { backgroundColor: tint }]} />
      <View style={[styles.bar, { backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { alignItems: "center", flexDirection: "row", gap: playPause.gap },
  play: {
    borderBottomColor: color.transparent,
    borderBottomWidth: playPause.height / 2,
    borderLeftWidth: playPause.play,
    borderTopColor: color.transparent,
    borderTopWidth: playPause.height / 2,
    marginRight: playPause.playGap,
  },
  bar: { height: playPause.height, width: playPause.bar },
});

import React from "react";
import { StyleSheet, View } from "react-native";

import { color, keyGlyph } from "#theme/tokens";

const { arrow } = keyGlyph;

/** ◀ or ▶, drawn as a triangle. */
export function ArrowGlyph({ tint, direction }: { tint: string; direction: "left" | "right" }) {
  return (
    <View
      style={[
        styles.arrow,
        direction === "left"
          ? { borderRightColor: tint, borderRightWidth: arrow.width }
          : { borderLeftColor: tint, borderLeftWidth: arrow.width },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  arrow: {
    borderBottomColor: color.transparent,
    borderBottomWidth: arrow.height / 2,
    borderTopColor: color.transparent,
    borderTopWidth: arrow.height / 2,
  },
});

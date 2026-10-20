import React from "react";
import { StyleSheet, View } from "react-native";

import { keyGlyph } from "#theme/tokens";

/** ☰: three short lines. */
export function MenuGlyph({ tint, mini = false }: { tint: string; mini?: boolean }) {
  const look = mini ? styles.mini : styles.full;
  return (
    <View style={mini ? styles.miniStack : styles.stack}>
      <View style={[look, { backgroundColor: tint }]} />
      <View style={[look, { backgroundColor: tint }]} />
      <View style={[look, { backgroundColor: tint }]} />
    </View>
  );
}

const { menu, menuMini } = keyGlyph;

const styles = StyleSheet.create({
  stack: { gap: menu.gap },
  miniStack: { gap: menuMini.gap },
  full: { borderRadius: menu.radius, height: menu.line, width: menu.width },
  mini: { borderRadius: menuMini.radius, height: menuMini.line, width: menuMini.width },
});

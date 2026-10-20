import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { layer } from "#foundation/tokens";

/** The host's layer (WallScreen's `overlay`), stacked above everything the wall draws. */
export function HostOverlay({ children }: { children: ReactNode }) {
  return (
    <View style={styles.layer} pointerEvents="box-none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: layer.host },
});

import { remoteHint } from "@boothwall/wall-ui/tokens";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

/**
 * Takes the TV focus while mounted, so an OK delivered as a press on the focused view lands here
 * instead of on the wall's own catcher underneath.
 */
export function FocusCatcher({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      hasTVPreferredFocus
      focusable
      onPress={onPress}
      style={styles.catcher}
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  catcher: {
    height: remoteHint.focusCatcher,
    left: 0,
    opacity: 0,
    position: "absolute",
    top: 0,
    width: remoteHint.focusCatcher,
  },
});

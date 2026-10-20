import { remoteHintCopy, RemoteHintOverlay } from "@boothwall/wall-ui";
import type { WallColors } from "@boothwall/wall-ui/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";

import { FocusCatcher } from "@/features/remote-hint/components/primitives/FocusCatcher";

export interface RemoteHintCardProps {
  demo: boolean;
  paused: boolean;
  colors: WallColors;
  onClose: () => void;
}

/** The remote help card, holding the TV focus so OK closes it. Remount it to restart the countdown. */
export function RemoteHintCard({ demo, paused, colors, onClose }: RemoteHintCardProps) {
  return (
    <View style={styles.screen}>
      <FocusCatcher onPress={onClose} label={remoteHintCopy.close} />
      <RemoteHintOverlay demo={demo} paused={paused} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { ...StyleSheet.absoluteFillObject } });

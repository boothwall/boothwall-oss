import { withAlpha } from "@boothwall/shared";
import React, { type ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

import { photoCall, radius, size, type WallColors } from "#theme/tokens";

/** A card with an accent edge and a soft accent halo, in the join card's language. */
export function GlowCard({
  colors,
  style,
  cardStyle,
  children,
}: {
  colors: WallColors;
  /** Placement of the whole card, halo included. */
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.halo,
        { backgroundColor: withAlpha(colors.brandPrimary, photoCall.haloOpacity) },
        style,
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surfaceSolid, borderColor: colors.brandPrimary },
          cardStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { borderRadius: radius.card + size.joinHaloReach, padding: size.joinHaloReach },
  card: { alignItems: "center", borderRadius: radius.card, borderWidth: size.joinGlowStroke },
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fontSize, radius, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

export type BadgeChipProps = {
  label: string;
  /** A set height, the label centred in it, as on the split header's title. */
  height?: number;
};

/** The config's `badge`, a small pill beside the logo. */
export function BadgeChip({ label, height }: BadgeChipProps) {
  const tint = useThemedStyles(themed);
  return (
    <View
      style={[styles.chip, tint.chip, height !== undefined && [styles.fixed, { height }]]}
      testID="badge-chip"
    >
      <Text numberOfLines={1} style={[styles.label, tint.label]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Upper-cased in the string, not by style: Vega sizes the box before a text transform, so the
  // last letter wrapped onto a second line on a Fire TV Stick.
  chip: {
    flexShrink: 0,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs,
  },
  fixed: {
    justifyContent: "center",
    paddingVertical: 0,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: "800",
    letterSpacing: tracking.label,
  },
});

/** The pill's accent fill and the label on it. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    chip: { backgroundColor: colors.brandPrimary },
    label: { color: colors.onBrandPrimary },
  }),
);

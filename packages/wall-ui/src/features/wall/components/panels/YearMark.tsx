import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { color, fontSize, fontWeight, size, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

/** "20 / 26" on two lines, as tall as the logo beside it, split by a thin accent rule. */
export function YearMark() {
  const { eventYear } = useWallSettings();
  const tint = useThemedStyles(themed);
  if (!eventYear) return null;
  const [century, year] = [eventYear.slice(0, 2), eventYear.slice(2)];
  return (
    <View style={styles.mark} accessible accessibilityLabel={eventYear}>
      <Text style={styles.digits}>{century}</Text>
      <View style={[styles.rule, tint.rule]} />
      <Text style={[styles.digits, tint.accent]}>{year}</Text>
    </View>
  );
}

/** Two lines and the rule fill the logo's height. */
const LINE = (size.logoHeight - 2) / 2;

const styles = StyleSheet.create({
  mark: {
    alignItems: "stretch",
    height: size.logoHeight,
    justifyContent: "center",
  },
  digits: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.mark,
    lineHeight: LINE,
    textAlign: "center",
  },
  rule: {
    height: 1,
    marginVertical: 0.5,
  },
});

/** The accent on the year's last digits and the rule above them. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    accent: { color: colors.brandPrimaryText },
    rule: { backgroundColor: colors.brandPrimary },
  }),
);

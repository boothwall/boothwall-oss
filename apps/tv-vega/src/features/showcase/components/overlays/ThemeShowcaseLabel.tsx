import { WALL_THEMES, type WallTheme } from "@boothwall/shared";
import {
  color,
  fontSize,
  fontWeight,
  overlayStage,
  radius,
  space,
  THEME_COLORS,
  tracking,
} from "@boothwall/wall-ui/tokens";
import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { SHOWCASE_LABEL_MS, showcaseCopy } from "@/features/showcase/constants/showcase.constants";
import { useFlash } from "@/platform/motion";
import { showcaseLabel } from "@/theme/tokens";

type ThemeShowcaseLabelProps = {
  theme?: WallTheme;
  shown: number;
  /** Menu steps the themes (demo mode), so the label says so. */
  menu: boolean;
};

/** Names the theme the wall just switched to, and the config line that sets it. */
export function ThemeShowcaseLabel({ theme, shown, menu }: ThemeShowcaseLabelProps) {
  const opacity = useFlash(shown, SHOWCASE_LABEL_MS);

  if (!theme) return null;
  const colors = THEME_COLORS[theme];

  return (
    <View style={styles.stage} pointerEvents="none">
      <Animated.View style={[styles.halo, { opacity }]}>
        <View style={[styles.card, { backgroundColor: colors.surfaceSolid }]}>
          <Text style={styles.label}>{showcaseCopy.label}</Text>
          <Text style={styles.name}>{showcaseCopy.name(theme)}</Text>
          <Text style={[styles.config, { color: colors.brandPrimaryText }]}>
            {showcaseCopy.config(theme)}
          </Text>
          <View style={styles.foot}>
            <View style={styles.dots}>
              {WALL_THEMES.map((each) => (
                <View
                  key={each}
                  style={[
                    styles.dot,
                    { backgroundColor: each === theme ? colors.brandPrimary : color.border },
                  ]}
                />
              ))}
            </View>
            {menu && <Text style={styles.hint}>{showcaseCopy.hint}</Text>}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: "center",
    height: overlayStage.height,
    justifyContent: "center",
    left: overlayStage.left,
    position: "absolute",
    top: overlayStage.top,
    width: overlayStage.width,
  },
  halo: {
    backgroundColor: color.cardShadowInner,
    borderRadius: radius.card + space.xs,
    padding: space.xs,
  },
  card: {
    alignItems: "center",
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    minWidth: showcaseLabel.minWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  label: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  name: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.heading,
  },
  config: {
    fontFamily: showcaseLabel.configFont,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    marginTop: space.xs,
  },
  foot: { alignItems: "center", flexDirection: "row", gap: space.sm, marginTop: space.sm },
  dots: { flexDirection: "row", gap: showcaseLabel.dotGap },
  dot: { borderRadius: radius.pill, height: showcaseLabel.dot, width: showcaseLabel.dot },
  hint: { color: color.textSecondary, fontSize: fontSize.caption },
});

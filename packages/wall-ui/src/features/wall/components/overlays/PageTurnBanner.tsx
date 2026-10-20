import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { PAGE_BANNER } from "#features/wall/constants/layout";
import { PAGE_BANNER_FADE_MS, PAGE_BANNER_MS } from "#features/wall/constants/timing";
import { NATIVE_DRIVER } from "#platform/motion";
import { color, fontSize, layer, radius, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

export type PageTurnBannerProps = {
  /** Bumped on every page turn; the banner shows once per change. */
  turn: number;
  page: number;
  pages: number;
};

/** A quiet "Page 2 of 3" while the cards sweep across, so a new set doesn't go unnoticed. */
export const PageTurnBanner = memo(function PageTurnBanner({
  turn,
  page,
  pages,
}: PageTurnBannerProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const show = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (turn === 0) return;
    const ease = { easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER };
    const run = Animated.sequence([
      Animated.timing(show, { toValue: 1, duration: PAGE_BANNER_FADE_MS.in, ...ease }),
      Animated.delay(PAGE_BANNER_MS),
      Animated.timing(show, { toValue: 0, duration: PAGE_BANNER_FADE_MS.out, ...ease }),
    ]);
    run.start();
    return () => run.stop();
  }, [show, turn]);

  const style = useMemo(
    () => ({
      opacity: show,
      transform: [{ scale: show.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
    }),
    [show],
  );

  return (
    <View style={styles.row} pointerEvents="none">
      <Animated.View style={[styles.banner, tint.banner, style]}>
        <Text style={styles.page}>{wallCopy.pageTurn(page, pages)}</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Centred over the photos, left of the side panel.
  row: {
    alignItems: "center",
    left: PAGE_BANNER.left,
    position: "absolute",
    top: PAGE_BANNER.top,
    width: PAGE_BANNER.width,
    zIndex: layer.chrome,
  },
  banner: {
    alignItems: "center",
    borderColor: color.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
  },
  page: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
});

/** The banner's card, in the theme's tone. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    banner: { backgroundColor: colors.surfaceSolid },
  }),
);

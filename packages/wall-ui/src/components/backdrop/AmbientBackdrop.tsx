import React, { memo, type ReactNode, useMemo } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import glowImage from "#assets/brand/glow.png";
import { imageSource, useArtwork } from "#platform/assets";
import { useWallPresentation } from "#platform/connection";
import { BACKDROP_IMAGES } from "#platform/display";
import { useLoop } from "#platform/motion";
import { themeBackdrop } from "#theme/themeArt";
import { ambient, CANVAS_HEIGHT, CANVAS_WIDTH } from "#theme/tokens";
import { themedStyles, useThemedStyles, useWallTheme } from "#theme/wallTheme";

const BACKDROP = imageSource(BACKDROP_IMAGES.sky);
const TWINKLE = imageSource(BACKDROP_IMAGES.twinkle);
const GLOW = imageSource(glowImage);

/**
 * The wall's atmosphere: the theme's backdrop (the night-sky photo on the universal wall), two
 * large soft glows drifting very slowly (the accent low on the horizon, its partner colour up
 * in the stars) and, on the night sky, a twinkle on the brightest stars. Three animated layers at most, each a small still image (no full-screen blend) moved by
 * opacity and transform on the native driver, so a Fire TV Stick composites it without any
 * per-frame JavaScript. With reduced motion it is the same picture, holding still.
 */
export const AmbientBackdrop = memo(function AmbientBackdrop({
  children,
}: {
  children?: ReactNode;
}) {
  const { theme } = useWallTheme();
  const tint = useThemedStyles(themed);
  // A theme brings its own backdrop; the universal wall keeps the night sky and its twinkle.
  const backdrop = themeBackdrop(theme);
  const { backdropUrl } = useWallPresentation();
  const art = useArtwork(backdropUrl, backdrop ?? BACKDROP);
  const nightSky = backdropUrl !== null && !art.custom && !backdrop;
  const accent = useLoop(ambient.accent.periodMs / 2, { rest: 1 });
  const partner = useLoop(ambient.partner.periodMs / 2, { rest: 1 });
  // Only the night sky twinkles: on a themed backdrop the loop would run for nothing.
  const sparkle = useLoop(ambient.twinkle.periodMs / 2, { rest: 1, paused: !nightSky });

  const accentStyle = useMemo(
    () => ({
      opacity: accent.interpolate({
        inputRange: [0, 1],
        outputRange: [ambient.accent.opacity * 0.6, ambient.accent.opacity],
      }),
      transform: [
        {
          translateX: accent.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -ambient.accent.drift],
          }),
        },
      ],
    }),
    [accent],
  );
  const partnerStyle = useMemo(
    () => ({
      opacity: partner.interpolate({
        inputRange: [0, 1],
        outputRange: [ambient.partner.opacity, ambient.partner.opacity * 0.5],
      }),
      transform: [
        {
          translateY: partner.interpolate({
            inputRange: [0, 1],
            outputRange: [0, ambient.partner.drift],
          }),
        },
      ],
    }),
    [partner],
  );
  const twinkleStyle = useMemo(
    () => ({ opacity: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }),
    [sparkle],
  );

  return (
    <>
      {art.source && (
        <Image
          source={art.source}
          onError={art.onError}
          testID="wall-backdrop"
          style={styles.fill}
          resizeMode="cover"
          accessible={false}
        />
      )}
      <Animated.Image
        source={GLOW}
        style={[styles.accent, tint.accent, accentStyle]}
        resizeMode="stretch"
        accessible={false}
      />
      <Animated.Image
        source={GLOW}
        style={[styles.partner, tint.partner, partnerStyle]}
        resizeMode="stretch"
        accessible={false}
      />
      {nightSky && (
        <Animated.Image
          source={TWINKLE}
          style={[styles.twinkle, twinkleStyle]}
          resizeMode="stretch"
          accessible={false}
        />
      )}
      {children}
      {art.custom && (
        <View testID="wall-artwork-scrim" style={[styles.fill, tint.scrim]} pointerEvents="none" />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  fill: {
    height: CANVAS_HEIGHT,
    left: 0,
    position: "absolute",
    top: 0,
    width: CANVAS_WIDTH,
  },
  twinkle: {
    height: ambient.twinkle.height,
    left: ambient.twinkle.left,
    position: "absolute",
    top: ambient.twinkle.top,
    width: ambient.twinkle.width,
  },
  // Rises from the backdrop's horizon, bottom right, behind the panel and away from the photos.
  accent: {
    height: ambient.accent.size,
    left: CANVAS_WIDTH - ambient.accent.size * 0.62,
    position: "absolute",
    top: CANVAS_HEIGHT - ambient.accent.size * 0.42,
    width: ambient.accent.size,
  },
  // Up among the bright stars, top right.
  partner: {
    height: ambient.partner.size,
    left: CANVAS_WIDTH - ambient.partner.size * 0.7,
    position: "absolute",
    top: -ambient.partner.size * 0.45,
    width: ambient.partner.size,
  },
});

/** The glows take the theme's accent and partner colour. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    accent: { tintColor: colors.brandPrimary },
    partner: { tintColor: colors.brandTertiary },
    scrim: { backgroundColor: colors.customBackdropScrim },
  }),
);

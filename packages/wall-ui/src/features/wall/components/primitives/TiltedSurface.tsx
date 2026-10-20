import React, { type ReactNode, useMemo } from "react";
import { Animated, Platform, type StyleProp, StyleSheet, type ViewStyle } from "react-native";

import { size } from "#theme/tokens";

export type TiltedSurfaceProps = {
  style: StyleProp<Animated.WithAnimatedValue<ViewStyle>>;
  children: ReactNode;
  /** Native drift must not share a props node with animations that finish and sync to JS. */
  drift?: Animated.AnimatedInterpolation<number>;
  pointerEvents?: "none" | "auto";
  testID?: string;
};

// Vega's cache flag is renderToHardwareTexture; the Android flag is ignored there.
// Keep the Vega extension in a spread because this shared package uses upstream RN types.
const textureProps = Platform.OS === "web" ? {} : { renderToHardwareTexture: true };
// RN Web passes this CSS property through. Keep the whole card in a composited layer so
// moving/scaling it doesn't re-rasterize its caption, emoji and metadata every frame.
const webTextureStyle =
  Platform.OS === "web"
    ? ({ willChange: "transform, opacity" } as ViewStyle & { willChange: string })
    : undefined;

/**
 * Every rotated card goes through this. Vega draws a rotated view with hard, stair-stepped
 * edges. Cache an untransformed inner surface, then rotate the outer view. The texture needs
 * room for the shadow, selection ring and the metadata strip outside the paper. Negative
 * margins cancel that padding so the card's layout and transform origin stay unchanged.
 */
export function TiltedSurface({
  style,
  children,
  drift,
  pointerEvents,
  testID,
}: TiltedSurfaceProps) {
  const driftStyle = useMemo(() => drift && { transform: [{ translateY: drift }] }, [drift]);
  const surface = (
    <Animated.View
      style={[webTextureStyle, style, drift && styles.inDrift]}
      pointerEvents={pointerEvents}
      testID={testID}
    >
      <Animated.View {...textureProps} style={styles.texture} renderToHardwareTextureAndroid>
        <Animated.View style={styles.inset}>{children}</Animated.View>
      </Animated.View>
    </Animated.View>
  );
  if (!drift) return surface;
  // A finite native animation syncs its view's props to JS when it finishes. The looping
  // drift's JS value is stale, so combining them in one transform snaps the card backwards.
  // Keep drift on its own positioned layer, retaining the card's draw order.
  return (
    <Animated.View
      style={[styles.drift, { zIndex: StyleSheet.flatten(style)?.zIndex }, driftStyle]}
      pointerEvents={pointerEvents}
    >
      {surface}
    </Animated.View>
  );
}

/**
 * The offset that puts an absolute child (a ring, a halo) `outset` dp outside the card. Inside a
 * TiltedSurface, absolute children are placed from the inset's padding edge, which already sits
 * `tiltInset` outside the card.
 */
export const outsideCard = (outset: number) => -(outset - size.tiltInset);

const styles = StyleSheet.create({
  drift: { position: "absolute", left: 0, top: 0 },
  // Let the wrapper take the card's size. Vega cannot move a cached descendant reliably
  // through a zero-sized parent (an absolutely positioned child gives it no layout bounds).
  inDrift: { position: "relative" },
  // The lifted metadata strip extends ~16 dp below the card, followed by its shadow
  // (8 dp offset + two 12 dp blur radii). Include those pixels in the texture itself.
  texture: { margin: -size.tiltTexturePadding, padding: size.tiltTexturePadding },
  inset: {
    margin: -size.tiltInset,
    padding: size.tiltInset,
  },
});

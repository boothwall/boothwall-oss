import { type PhotoDTO, printedCategory } from "@boothwall/shared";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { FOOTER, SPOTLIGHT, STAGE } from "#features/wall/constants/layout";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { NATIVE_DRIVER } from "#platform/motion";
import { CANVAS_HEIGHT, color, fontSize, layer, layout, radius, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

export type IncomingToastProps = {
  photo: PhotoDTO | null;
  /** A photo is open: the toast moves under its details, clear of the big card. */
  spotlightOpen: boolean;
};

export const IncomingToast = memo(function IncomingToast({
  photo,
  spotlightOpen,
}: IncomingToastProps) {
  const { wall: wallCopy } = useWallCopy();
  const { categories } = useWallSettings();
  const tint = useThemedStyles(themed);
  const show = useRef(new Animated.Value(0)).current;
  const visible = photo !== null;

  useEffect(() => {
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: visible ? 320 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [show, visible]);

  const style = useMemo(
    () => ({
      opacity: show,
      transform: [{ translateY: show.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
    }),
    [show],
  );

  return (
    <Animated.View
      style={[styles.toast, tint.toast, spotlightOpen && styles.besideSpotlight, style]}
      pointerEvents="none"
    >
      <View style={[styles.dot, tint.dot]} />
      <Text style={styles.text}>
        <Text style={styles.strong}>{wallCopy.incoming.title}</Text>
        {photo
          ? [printedCategory(categories, photo.tribe), wallCopy.incoming.upNext]
              .filter(Boolean)
              .map((part) => `  ·  ${part}`)
              .join("")
          : ""}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    // Just above the now-showing bar, on the safe line.
    bottom: CANVAS_HEIGHT - FOOTER.top + layout.footerGap,
    flexDirection: "row",
    gap: space.sm,
    left: STAGE.left,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    position: "absolute",
    zIndex: layer.toast,
  },
  besideSpotlight: {
    left: SPOTLIGHT.detailsLeft,
  },
  dot: {
    borderRadius: radius.pill,
    height: space.sm,
    width: space.sm,
  },
  text: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  strong: {
    color: color.textPrimary,
    fontWeight: "800",
  },
});

/** The toast's canvas, its accent edge and dot. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    toast: { backgroundColor: colors.canvas, borderColor: colors.brandPrimary },
    dot: { backgroundColor: colors.brandPrimary },
  }),
);

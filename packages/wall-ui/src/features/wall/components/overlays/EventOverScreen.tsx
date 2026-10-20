import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { useWallConnection } from "#platform/connection";
import { NATIVE_DRIVER } from "#platform/motion";
import { color, fontSize, layer, layout, radius, size, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { QrCode } from "../primitives/QrCode";

export type EventOverScreenProps = {
  /** Photos on the wall, for the closing count. */
  total: number;
};

const FADE_MS = 600;
/** The recap address without its scheme, printed under the QR for phones that can't scan. */

/**
 * Once the hosts end the event: the wall fades to a thank-you and one big QR code to the recap
 * page, so guests leave with every photo. Reopening the event brings the wall back.
 */
export const EventOverScreen = memo(function EventOverScreen({ total }: EventOverScreenProps) {
  const { wall: wallCopy } = useWallCopy();
  const { recapUrl } = useWallConnection();
  const { eventName } = useWallSettings();
  const tint = useThemedStyles(themed);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [fade]);
  const fadeStyle = useMemo(() => ({ opacity: fade }), [fade]);

  return (
    <Animated.View style={[styles.root, tint.root, fadeStyle]}>
      <View style={styles.text}>
        <Text style={[styles.eyebrow, tint.eyebrow]}>{wallCopy.eventOver.eyebrow}</Text>
        <Text style={styles.title}>{wallCopy.eventOver.title}</Text>
        <Text style={styles.body}>
          {recapUrl ? wallCopy.eventOver.body(eventName) : wallCopy.eventOver.closedBody(eventName)}
        </Text>
        <Text style={styles.count}>{wallCopy.eventOver.moments(total)}</Text>
      </View>
      {recapUrl && (
        <View style={[styles.card, tint.card]}>
          <Text style={styles.scan}>{wallCopy.eventOver.scan}</Text>
          <View style={styles.qrFrame}>
            {/* Paths are case-sensitive; use the exact resolved URL. */}
            <QrCode value={recapUrl} size={size.recapQr} />
          </View>
          <Text style={styles.host} numberOfLines={1}>
            {recapUrl.replace(/^https?:\/\//, "")}
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    flexDirection: "row",
    gap: space["2xl"],
    justifyContent: "center",
    paddingHorizontal: layout.safeX,
    zIndex: layer.eventOver,
  },
  text: {
    flex: 1,
    gap: space.md,
    maxWidth: size.recapTextWidth,
  },
  eyebrow: {
    fontSize: fontSize.caption,
    fontWeight: "800",
    letterSpacing: tracking.mark,
    textTransform: "uppercase",
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.title,
    fontWeight: "800",
    letterSpacing: tracking.title,
    lineHeight: fontSize.title * 1.05,
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.lead,
    lineHeight: fontSize.lead * 1.4,
  },
  count: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontWeight: "700",
    marginTop: space.sm,
  },
  card: {
    alignItems: "center",
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.md,
    padding: space.lg,
  },
  scan: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: "800",
  },
  qrFrame: {
    backgroundColor: color.paper,
    borderRadius: space.sm,
    padding: space.sm + 2,
  },
  host: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
});

/** The theme's closing scrim and the accent on the eyebrow. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    root: { backgroundColor: colors.eventOverScrim },
    eyebrow: { color: colors.brandPrimaryText },
    card: { backgroundColor: colors.surfaceSolid },
  }),
);

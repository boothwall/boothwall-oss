import React, { Fragment, useEffect, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import {
  closingKeys,
  REMOTE_HINT_FADE_IN_MS,
  REMOTE_HINT_MS,
  remoteHintCopy,
  remoteHintRows,
} from "#features/remote-hint/constants/remoteHint.constants";
import { NATIVE_DRIVER } from "#platform/motion";
import {
  color,
  fontSize,
  fontWeight,
  radius,
  remoteHint,
  size,
  tracking,
  type WallColors,
} from "#theme/tokens";

import { CountdownLine } from "../primitives/CountdownLine";
import { HintKeyColumn } from "../primitives/HintKeyColumn";
import { KeyCap } from "../primitives/KeyCap";

export interface RemoteHintOverlayProps {
  demo: boolean;
  paused: boolean;
  colors: WallColors;
}

/**
 * What every remote button does, over the dimmed wall. It only draws: the host closes it, and
 * remounts it to restart the countdown.
 */
export function RemoteHintOverlay({ demo, paused, colors }: RemoteHintOverlayProps) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: REMOTE_HINT_FADE_IN_MS,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [opacity]);
  const tint = colors.brandPrimaryText;

  return (
    <Animated.View style={[styles.screen, { opacity }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.spotlightScrim }]} />
      <View style={styles.centre}>
        <View style={styles.halo}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceSolid, borderColor: colors.joinBorder },
            ]}
          >
            <Text style={styles.title}>{remoteHintCopy.title}</Text>
            {remoteHintRows({ demo, paused }).map((row) => (
              <View key={row.keys} style={styles.row}>
                <HintKeyColumn keys={row.keys} tint={tint} />
                <Text style={styles.label}>
                  {row.label}
                  {row.note && <Text style={styles.note}>{` ${row.note}`}</Text>}
                </Text>
              </View>
            ))}
            <View style={styles.foot}>
              {closingKeys(demo).map((glyph, index) => (
                <Fragment key={glyph}>
                  {index > 0 && <Text style={styles.footText}>{remoteHintCopy.or}</Text>}
                  <KeyCap glyph={glyph} tint={tint} mini />
                </Fragment>
              ))}
              <Text style={styles.footText}>{remoteHintCopy.closes}</Text>
            </View>
            <CountdownLine durationMs={REMOTE_HINT_MS} tint={colors.brandPrimary} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFillObject },
  centre: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  halo: {
    backgroundColor: color.cardShadowInner,
    borderRadius: radius.card + size.joinHaloReach,
    padding: size.joinHaloReach,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: size.joinGlowStroke,
    paddingBottom: remoteHint.padBottom,
    paddingHorizontal: remoteHint.padX,
    paddingTop: remoteHint.padTop,
    width: remoteHint.cardWidth,
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.heading,
    lineHeight: remoteHint.titleLine,
    marginBottom: remoteHint.titleGap,
  },
  row: {
    alignItems: "center",
    borderTopColor: color.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: remoteHint.rowGap,
    minHeight: remoteHint.row,
    paddingVertical: remoteHint.rowPadY,
  },
  label: {
    color: color.textPrimary,
    flexShrink: 1,
    fontSize: remoteHint.label,
    fontWeight: fontWeight.semibold,
  },
  note: { color: color.textSecondary, fontWeight: fontWeight.medium },
  foot: {
    alignItems: "center",
    borderTopColor: color.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: remoteHint.footGap,
    paddingTop: remoteHint.footPadTop,
  },
  footText: {
    color: color.textSecondary,
    fontSize: remoteHint.label,
    fontWeight: fontWeight.semibold,
  },
});

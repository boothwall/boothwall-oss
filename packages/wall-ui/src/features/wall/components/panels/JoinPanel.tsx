import { type PhotoDTO, type WallStatsDTO } from "@boothwall/shared";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { HEADER_BAND, PANEL } from "#features/wall/constants/layout";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { useWallConnection, useWallPresentation } from "#platform/connection";
import {
  CANVAS_HEIGHT,
  color,
  fontSize,
  fontWeight,
  layout,
  radius,
  size,
  space,
  tracking,
} from "#theme/tokens";
import { themedStyles, useThemedStyles, useWallTheme } from "#theme/wallTheme";

import { AttentionRing } from "../primitives/AttentionRing";
import { BreathingGlow } from "../primitives/BreathingGlow";
import { QrCode } from "../primitives/QrCode";
import { InfoSlot } from "./InfoSlot";
import { QrSignal } from "./QrSignal";

/** The longest join address that fits the card on one line at caption size. */
const JOIN_ADDRESS_MAX = 24;

export type JoinPanelProps = {
  stats: WallStatsDTO;
  pool: readonly PhotoDTO[];
  /** The wall is empty: the QR pulses and says "Scan me", and Who's here waits. */
  attention?: boolean;
};

/**
 * The column beside the photos: one QR to join, with the short address and a hint under it, and
 * the panel's foot pinned to the bottom edge, level with the now-showing strip. There Who's here
 * and the source card take turns in one place (InfoSlot), so nothing else moves while the wall
 * runs. An empty wall shows only the QR.
 */
export const JoinPanel = memo(function JoinPanel({
  stats,
  pool,
  attention = false,
}: JoinPanelProps) {
  const { joinUrl } = useWallConnection();
  const { showSourceOnWall: showSource = false } = useWallPresentation();
  const joinHost = joinUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // The address is a fallback for guests who can't scan: shown only when it fits on one line.
  const showHost =
    joinHost.length <= JOIN_ADDRESS_MAX && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(joinHost);
  const { showWhoIsHere } = useWallSettings();
  const { theme } = useWallTheme();
  const tint = useThemedStyles(themed);
  const voice = useWallCopy().join[theme];
  const split = useWallLook().header === "split";
  return (
    <View style={[styles.column, split && styles.splitColumn]} pointerEvents="none">
      {split && <View style={styles.spacer} />}
      <View style={[styles.card, tint.card]} testID="wall-join">
        {attention ? <AttentionRing /> : <BreathingGlow />}
        <View style={styles.titleRow}>
          <Text style={styles.titleIcon} accessible={false}>
            {voice.icon}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {voice.title}
          </Text>
        </View>
        <View style={styles.qrFrame}>
          {/* Preserve the selected event path and any case-sensitive query values. */}
          <QrCode value={joinUrl} size={attention ? size.joinQrEmpty : size.joinQr} />
        </View>
        {showHost && (
          <Text style={[styles.joinHost, tint.joinHost]} numberOfLines={1}>
            {joinHost}
          </Text>
        )}
        <Text style={styles.joinHint} numberOfLines={2}>
          {voice.hint}
        </Text>
        <QrSignal total={stats.total} />
      </View>
      {!attention && (
        <>
          <View style={styles.spacer} />
          <InfoSlot stats={stats} pool={pool} whoIsHere={showWhoIsHere} source={showSource} />
        </>
      )}
      {split && attention && <View style={styles.spacer} />}
    </View>
  );
});

const styles = StyleSheet.create({
  // The panel column: its top on the content's top, level with the collage, down to the safe line.
  column: {
    bottom: CANVAS_HEIGHT - PANEL.bottom,
    gap: layout.panelGap,
    justifyContent: "flex-start",
    left: PANEL.left,
    position: "absolute",
    top: PANEL.top,
    width: PANEL.width,
  },
  // Under the split header the column starts at the header's band, and the join card sits with
  // equal gaps above and below it.
  splitColumn: {
    gap: 0,
    top: HEADER_BAND.bottom,
  },
  // Pushes the foot (Who's here or the source card) down to the column's bottom edge.
  spacer: {
    flex: 1,
  },
  // The one thing guests act on: the panel's only accent-edged card.
  card: {
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.md - space.xs,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 2,
    marginBottom: space.sm + 2,
  },
  titleIcon: {
    fontSize: fontSize.heading,
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.heading,
  },
  qrFrame: {
    backgroundColor: color.paper,
    borderRadius: space.sm,
    padding: space.sm,
  },
  joinHint: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    marginTop: space.xs + 2,
    textAlign: "center",
  },
  joinHost: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    marginTop: space.sm + 2,
  },
});

/** The join card's accent: its edge and the address. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surfaceSolid, borderColor: colors.joinBorder },
    joinHost: { color: colors.brandPrimaryText },
  }),
);

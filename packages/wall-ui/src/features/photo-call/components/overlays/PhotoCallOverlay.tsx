import { withAlpha } from "@boothwall/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { PHOTO_CALL_MS, photoCallCopy } from "#features/photo-call/constants/photoCall.constants";
import { useCountdown } from "#features/photo-call/hooks/useCountdown";
import { readableUrl } from "#features/photo-call/utils/photoCall.utils";
import { QrCode } from "#features/wall";
import {
  color,
  fontSize,
  fontWeight,
  layout,
  photoCall,
  radius,
  size,
  space,
  tracking,
  type WallColors,
} from "#theme/tokens";

import { CountdownRing } from "../primitives/CountdownRing";
import { GlowCard } from "../primitives/GlowCard";

export interface PhotoCallOverlayProps {
  endsAt: number;
  mission: string | null;
  newPhotos: number;
  joinUrl: string;
  colors: WallColors;
  onEnd: () => void;
  /** How to end the call early, under the wall; the TV remote's Back by default, `null` for none. */
  backHint?: string | null;
}

/** A minute for everyone in the room to send a photo: the join QR, a mission and a countdown. */
export function PhotoCallOverlay({
  endsAt,
  mission,
  newPhotos,
  joinUrl,
  colors,
  onEnd,
  backHint = photoCallCopy.back,
}: PhotoCallOverlayProps) {
  const secondsLeft = useCountdown(endsAt, onEnd);

  return (
    <View style={styles.screen}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(colors.canvas, photoCall.scrimOpacity) },
        ]}
      />

      <View style={styles.copy}>
        <Text style={[styles.kicker, { color: colors.brandPrimaryText }]}>
          {photoCallCopy.kicker}
        </Text>
        <Text style={styles.title}>{photoCallCopy.title}</Text>
        {mission && (
          <View style={[styles.mission, { backgroundColor: colors.surfaceSolid }]}>
            <Text style={styles.missionLabel}>{photoCallCopy.mission}</Text>
            <Text style={styles.missionName}>{mission}</Text>
          </View>
        )}
      </View>

      <View style={styles.timer}>
        <CountdownRing
          secondsLeft={secondsLeft}
          totalSeconds={PHOTO_CALL_MS / 1000}
          accent={colors.brandPrimary}
        />
        <View>
          <Text style={styles.count}>
            {newPhotos > 0 ? photoCallCopy.arrived(newPhotos) : photoCallCopy.waiting}
          </Text>
          <Text style={styles.countNote}>
            {newPhotos > 0 ? photoCallCopy.arrivedNote : photoCallCopy.waitingNote}
          </Text>
        </View>
      </View>

      <GlowCard colors={colors} style={styles.qrPlace} cardStyle={styles.qrCard}>
        <Text style={styles.scan}>{photoCallCopy.scan}</Text>
        <View style={styles.qrFrame}>
          <QrCode value={joinUrl} size={photoCall.qr - 2 * space.md} />
        </View>
        <Text style={[styles.url, { color: colors.brandPrimaryText }]} numberOfLines={1}>
          {readableUrl(joinUrl)}
        </Text>
        <Text style={styles.noApp}>{photoCallCopy.noApp}</Text>
      </GlowCard>

      {backHint && <Text style={styles.back}>{backHint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFillObject },
  copy: {
    left: layout.safeX,
    position: "absolute",
    top: photoCall.copyTop,
    width: photoCall.copyWidth,
  },
  kicker: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.mark,
    textTransform: "uppercase",
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.title,
    marginTop: space.sm,
  },
  mission: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: color.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  missionLabel: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  missionName: { color: color.textPrimary, fontSize: fontSize.lead, fontWeight: fontWeight.bold },
  timer: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
    left: layout.safeX,
    position: "absolute",
    top: photoCall.timerTop,
  },
  count: { color: color.textPrimary, fontSize: fontSize.heading, fontWeight: fontWeight.heavy },
  countNote: { color: color.textSecondary, fontSize: fontSize.lead },
  qrPlace: {
    position: "absolute",
    right: layout.safeX - size.joinHaloReach,
    top: photoCall.qrTop - size.joinHaloReach,
  },
  qrCard: {
    padding: photoCall.qrCardPadding,
    width: photoCall.qrCardWidth,
  },
  scan: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.heading,
  },
  qrFrame: {
    backgroundColor: color.paper,
    borderRadius: radius.control,
    marginTop: space.md,
    padding: space.md,
  },
  url: { fontSize: fontSize.body, fontWeight: fontWeight.bold, marginTop: space.md },
  noApp: { color: color.textSecondary, fontSize: fontSize.caption, marginTop: space.xs },
  back: {
    bottom: layout.safeY,
    color: color.textMuted,
    fontSize: fontSize.caption,
    left: layout.safeX,
    position: "absolute",
  },
});

import { withAlpha } from "@boothwall/shared";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { photoCallCopy } from "#features/photo-call/constants/photoCall.constants";
import { useCountdown } from "#features/photo-call/hooks/useCountdown";
import type { Finale } from "#features/photo-call/state/photoCall";
import {
  color,
  fontSize,
  fontWeight,
  overlayStage,
  photoCallFinale,
  space,
  tracking,
  type WallColors,
} from "#theme/tokens";

import { GlowCard } from "../primitives/GlowCard";

/** How the call went: the photos it brought, then back to the wall. */
export function PhotoCallFinale({
  finale,
  colors,
  onEnd,
}: {
  finale: Finale;
  colors: WallColors;
  onEnd: () => void;
}) {
  useCountdown(finale.until, onEnd);
  const landed = finale.count > 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(colors.canvas, photoCallFinale.scrimOpacity) },
        ]}
      />
      <View style={styles.stage}>
        <GlowCard colors={colors} cardStyle={styles.card}>
          <Text style={[styles.kicker, { color: colors.brandPrimaryText }]}>
            {photoCallCopy.kicker}
          </Text>
          {landed ? (
            <>
              <View style={styles.thumbs}>
                {finale.photos.map((photo) => (
                  <View key={photo.id} style={styles.thumbFrame}>
                    <Image source={{ uri: photo.thumbUrl }} style={styles.thumb} />
                  </View>
                ))}
              </View>
              <Text style={styles.count}>{finale.count}</Text>
              <Text style={styles.what}>{photoCallCopy.finaleArrived(finale.count)}</Text>
              <Text style={styles.note}>{photoCallCopy.finaleThanks}</Text>
            </>
          ) : (
            <>
              <Text style={styles.what}>{photoCallCopy.finaleWrap}</Text>
              <Text style={styles.note}>{photoCallCopy.finaleOpen}</Text>
            </>
          )}
        </GlowCard>
      </View>
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
  card: {
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  kicker: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.mark,
    textTransform: "uppercase",
  },
  thumbs: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  thumbFrame: {
    backgroundColor: color.paper,
    borderRadius: photoCallFinale.thumbRadius,
    padding: space.xs,
  },
  thumb: { height: photoCallFinale.thumb, width: photoCallFinale.thumb },
  count: {
    color: color.textPrimary,
    fontSize: photoCallFinale.count,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.title,
    marginTop: space.sm,
  },
  what: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.heading,
  },
  note: { color: color.textSecondary, fontSize: fontSize.lead, marginTop: space.sm },
});

import { printedCategory } from "@boothwall/shared";
import React, { memo, type ReactNode, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { type PlacedPhoto, POLAROID, SPOTLIGHT } from "#features/wall/constants/layout";
import { useSpotlightTransition } from "#features/wall/hooks/useSpotlightTransition";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { fitFontSize } from "#features/wall/utils/fitFontSize";
import { formatRelative } from "#features/wall/utils/formatRelative";
import { color, fontSize, layer, radius, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { ProgressLine } from "../primitives/ProgressLine";
import { SpotlightCards } from "./SpotlightCards";

export type SpotlightProps = {
  /** The photo to show full screen and the wall slot it zooms out of; null closes it. */
  selection: PlacedPhoto | null;
  /** Shown above the caption, like a pick's "Crowd favourite" label. */
  badge?: ReactNode;
  /** Over the countdown; "Next photo" unless said otherwise. */
  nextLabel?: string;
  /** Its place among the wall's photos; null hides it (a pick isn't part of the slideshow). */
  position: number | null;
  total: number;
  durationMs: number;
  cycleKey: string;
  paused: boolean;
};

const DETAILS_SHIFT = 16;

export const Spotlight = memo(function Spotlight({
  selection,
  badge,
  nextLabel,
  position,
  total,
  durationMs,
  cycleKey,
  paused,
}: SpotlightProps) {
  const { wall: wallCopy } = useWallCopy();
  const { progress, shown } = useSpotlightTransition(selection);
  const { categories, eventHashtag } = useWallSettings();
  const tint = useThemedStyles(themed);

  const animated = useMemo(
    () => ({
      backdrop: { opacity: progress },
      details: {
        opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }),
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [DETAILS_SHIFT, 0],
            }),
          },
        ],
      },
    }),
    [progress],
  );

  if (!shown) return null;
  const { photo } = shown;
  const caption = photo.caption ?? wallCopy.noCaption;
  const category = printedCategory(categories, photo.tribe);
  const captionSize = fitFontSize(caption, SPOTLIGHT.detailsWidth, CAPTION_FIT);

  return (
    <View style={styles.root} pointerEvents="none" testID="wall-spotlight">
      <Animated.View style={[styles.backdrop, tint.backdrop, animated.backdrop]} />
      <View style={styles.cardBox}>
        <SpotlightCards current={shown} progress={progress} />
      </View>
      <Animated.View style={[styles.details, tint.details, animated.details]}>
        {/* A pick's badge takes the hashtag's place: one label above the caption is enough. */}
        {badge ?? <Text style={[styles.hashtag, tint.hashtag]}>{eventHashtag}</Text>}
        <Text
          style={[styles.caption, { fontSize: captionSize, lineHeight: captionSize * 1.15 }]}
          numberOfLines={2}
        >
          {caption}
        </Text>
        <View style={styles.chips}>
          {category && <Text style={[styles.chip, tint.chip]}>{category}</Text>}
          <Text style={styles.time}>{formatRelative(photo.createdAt)}</Text>
        </View>
        <View style={styles.next}>
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>
              {paused ? wallCopy.paused : (nextLabel ?? wallCopy.nextPhoto)}
            </Text>
            {position !== null && (
              <Text style={styles.position}>{wallCopy.position(position, total)}</Text>
            )}
          </View>
          <ProgressLine
            width={SPOTLIGHT.detailsWidth}
            durationMs={durationMs}
            cycleKey={cycleKey}
            paused={paused}
          />
        </View>
      </Animated.View>
    </View>
  );
});

// Shrinks long captions so most stay on one line instead of leaving one word on the next.
const CAPTION_FIT = { max: fontSize.title - 16, min: fontSize.heading, charWidth: 0.55 };

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    flexDirection: "row",
    gap: SPOTLIGHT.gap,
    justifyContent: "center",
    zIndex: layer.spotlight,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  cardBox: {
    height: SPOTLIGHT.cardWidth * POLAROID.aspect,
    width: SPOTLIGHT.cardWidth,
  },
  // Padding sits outside the column (negative margin), so the layout maths stay the same.
  details: {
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.md,
    margin: -space.lg,
    padding: space.lg,
    width: SPOTLIGHT.detailsWidth + space.lg * 2,
  },
  hashtag: {
    fontSize: fontSize.heading,
    fontWeight: "800",
  },
  caption: {
    color: color.textPrimary,
    fontWeight: "800",
    letterSpacing: tracking.heading,
  },
  chips: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  chip: {
    borderRadius: radius.pill,
    fontSize: fontSize.caption + 1,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
  },
  time: {
    color: color.textSecondary,
    fontSize: fontSize.body,
  },
  next: {
    gap: space.sm,
    marginTop: space.lg,
  },
  nextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nextLabel: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: "800",
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  position: {
    color: color.textPrimary,
    fontSize: fontSize.caption + 1,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});

/** The theme's scrim and details panel, the accent hashtag and the category chip. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    backdrop: { backgroundColor: colors.spotlightScrim },
    details: { backgroundColor: colors.spotlightPanel },
    hashtag: { color: colors.brandPrimaryText },
    chip: { backgroundColor: colors.brandSecondary, color: colors.onBrandSecondary },
  }),
);

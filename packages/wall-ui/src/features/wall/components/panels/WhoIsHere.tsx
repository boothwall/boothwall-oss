import type { PhotoDTO, WallStatsDTO } from "@boothwall/shared";
import React, { memo, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { WHO_IS_HERE } from "#features/wall/constants/layout";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { rankCrowd } from "#features/wall/utils/whoIsHere";
import { color, fontSize, fontWeight, radius, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { PopNumber } from "../primitives/PopNumber";

export type WhoIsHereProps = {
  stats: WallStatsDTO;
  pool: readonly PhotoDTO[];
};

/**
 * Who's here, under the QR: per category a little stack of its newest photos as tiny polaroids,
 * the name and the count, most first, "+n more" beside the title past four rows. The leader
 * is in the accent; counts pop when they change.
 */
export const WhoIsHere = memo(function WhoIsHere({ stats, pool }: WhoIsHereProps) {
  const { wall: wallCopy } = useWallCopy();
  const { categories } = useWallSettings();
  const tint = useThemedStyles(themed);
  const { rows, more } = useMemo(
    () =>
      rankCrowd(categories, stats, pool, {
        maxRows: WHO_IS_HERE.maxRows,
        thumbs: WHO_IS_HERE.thumbs,
      }),
    [categories, pool, stats],
  );
  if (rows.length === 0) return null;

  return (
    <View style={[styles.card, tint.card]} testID="wall-who-is-here">
      <View style={styles.head}>
        <Text style={styles.title}>{wallCopy.whoIsHereTitle}</Text>
        {more > 0 && <Text style={styles.title}>{wallCopy.whoMore(more)}</Text>}
      </View>
      {rows.map((row, index) => {
        const leader = index === 0 && !row.neutral;
        return (
          <View
            key={row.id}
            style={styles.row}
            accessible
            accessibilityLabel={wallCopy.whoIsHereRow(row.label, row.count)}
          >
            <ThumbStack photos={row.photos} />
            <Text
              style={[
                styles.label,
                leader && styles.leaderLabel,
                leader && tint.leaderLabel,
                row.neutral && styles.neutral,
              ]}
              numberOfLines={1}
            >
              {row.label}
            </Text>
            <PopNumber
              value={row.count}
              style={StyleSheet.flatten([
                styles.count,
                leader && tint.leaderCount,
                row.neutral && styles.neutral,
              ])}
            />
          </View>
        );
      })}
    </View>
  );
});

/** Up to three tiny polaroids, the newest in front. */
function ThumbStack({ photos }: { photos: readonly PhotoDTO[] }) {
  return (
    <View style={styles.stack}>
      {[...photos].reverse().map((photo, back) => {
        const index = photos.length - 1 - back;
        return (
          <View
            key={photo.id}
            style={[
              styles.thumb,
              {
                left: index * STACK_STEP,
                transform: [{ rotate: WHO_IS_HERE.tilts[index] ?? "0deg" }],
              },
            ]}
          >
            <Thumb uri={photo.thumbUrl} />
          </View>
        );
      })}
    </View>
  );
}

function Thumb({ uri }: { uri: string }) {
  const tint = useThemedStyles(themed);
  const source = useMemo(() => ({ uri }), [uri]);
  return <Image source={source} style={[styles.thumbPhoto, tint.thumbPhoto]} />;
}

const { thumbPhoto: THUMB_PHOTO, thumbEdge: THUMB_EDGE, thumbStep: STACK_STEP } = size;

const styles = StyleSheet.create({
  card: {
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.xs + 2,
    paddingHorizontal: space.md,
    paddingVertical: space.md - space.xs,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
    minHeight: THUMB_PHOTO + THUMB_EDGE * 4,
  },
  stack: {
    height: THUMB_PHOTO + THUMB_EDGE * 4,
    width: THUMB_PHOTO + THUMB_EDGE * 2 + STACK_STEP * (WHO_IS_HERE.thumbs - 1),
  },
  thumb: {
    backgroundColor: color.paper,
    borderRadius: size.focusRing - 1,
    paddingBottom: THUMB_EDGE * 3,
    paddingHorizontal: THUMB_EDGE,
    paddingTop: THUMB_EDGE,
    position: "absolute",
    top: 0,
  },
  thumbPhoto: {
    height: THUMB_PHOTO,
    width: THUMB_PHOTO,
  },
  label: {
    color: color.textSecondary,
    flex: 1,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  leaderLabel: {
    fontWeight: fontWeight.heavy,
  },
  count: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontVariant: ["tabular-nums"],
    fontWeight: fontWeight.heavy,
  },
  neutral: {
    color: color.textMuted,
  },
});

/** The accent on the leading category's name and count. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    leaderLabel: { color: colors.brandPrimaryText },
    leaderCount: { color: colors.brandPrimaryText },
    card: { backgroundColor: colors.surfaceSolid },
    thumbPhoto: { backgroundColor: colors.surfaceSolid },
  }),
);

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import type { FeedStatus } from "#features/wall/state/connectionPhase";
import { themedStyles, useThemedStyles } from "#foundation/theme";
import { color, fontSize, fontWeight, size, space } from "#foundation/tokens";

import { PopNumber } from "../primitives/PopNumber";
import { LivePill } from "./LivePill";

export type HeaderMetaProps = {
  hashtag?: string;
  total: number;
  status: FeedStatus;
  ended: boolean;
  notice?: string;
};

/** The split header's right column: the hashtag on the title's row, the count and Live under it. */
export function HeaderMeta({ hashtag, total, status, ended, notice }: HeaderMetaProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const counted = total > 0;
  return (
    <View style={[styles.column, styles.end]}>
      <View style={styles.titleRow}>
        {hashtag ? (
          <Text style={[styles.hashtag, tint.accent]} numberOfLines={1}>
            {hashtag}
          </Text>
        ) : null}
      </View>
      <View style={[styles.infoRow, styles.status]}>
        {counted && (
          <View
            style={styles.count}
            accessible
            accessibilityLabel={`${total} ${wallCopy.moments(total)}`}
          >
            <PopNumber value={total} style={styles.countNumber} />
            <Text style={styles.countLabel}>{wallCopy.moments(total)}</Text>
          </View>
        )}
        {counted && !ended && <Text style={styles.dot}>·</Text>}
        {!ended && <LivePill status={status} label={notice} inline />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    height: size.headerBand,
  },
  // Fixed line boxes, lifted like the event column's so the two columns share their baselines.
  titleRow: {
    alignItems: "baseline",
    flexDirection: "row",
    height: size.eventTitleLine,
    marginTop: -size.eventTitleLift,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    height: size.eventLine,
    marginTop: -size.eventLineLift,
  },
  end: {
    alignItems: "flex-end",
    flexShrink: 0,
    marginLeft: "auto",
  },
  hashtag: {
    fontSize: fontSize.eventTitle,
    fontWeight: fontWeight.heavy,
    lineHeight: size.eventTitleLine,
  },
  status: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  count: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 2,
  },
  countNumber: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
    lineHeight: size.eventLine,
  },
  countLabel: {
    color: color.textSecondary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    lineHeight: size.eventLine,
  },
  dot: {
    color: color.textMuted,
    fontSize: fontSize.body,
    lineHeight: size.eventLine,
  },
});

/** The hashtag in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    accent: { color: colors.brandPrimaryText },
  }),
);

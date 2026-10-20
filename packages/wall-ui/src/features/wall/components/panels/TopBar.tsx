import type { EventPresentation } from "@boothwall/shared";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import logo from "#assets/brand/logo.png";
import { useWallCopy } from "#copy";
import { HEADER } from "#features/wall/constants/layout";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import type { FeedStatus } from "#features/wall/state/connectionPhase";
import { imageSource } from "#platform/assets";
import { useWallPresentation } from "#platform/connection";
import { color, fontSize, fontWeight, layer, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { PopNumber } from "../primitives/PopNumber";
import { BadgeChip } from "./BadgeChip";
import { BRAND_INK_LEFT, HeaderLogo } from "./HeaderLogo";
import { LivePill } from "./LivePill";
import { SplitHeader } from "./SplitHeader";
import { YearMark } from "./YearMark";

const LOGO = imageSource(logo);

export type TopBarProps = {
  total: number;
  status: FeedStatus;
  /** The event is over: the wall holds still, so there is no Live to show. */
  ended?: boolean;
  /** Said in the Live pill instead of its state, e.g. that the wall shows saved photos. */
  notice?: string;
};

/** The header zone, in the classic look or split (`wall.header` in boothwall.config.ts). */
export const TopBar = memo(function TopBar(props: TopBarProps) {
  const presentation = useWallPresentation();
  return useWallLook().header === "split" ? (
    <SplitHeader {...props} presentation={presentation} />
  ) : (
    <ClassicHeader {...props} presentation={presentation} />
  );
});

/**
 * The classic header: the logo lockup at TV size and the stacked year on the left; the hashtag,
 * the photo count and the Live pill on the right. An empty wall shows no count, only the pill.
 */
function ClassicHeader({
  total,
  status,
  ended = false,
  notice,
  presentation: { badge, venue, logoUrl },
}: TopBarProps & { presentation: EventPresentation }) {
  const { wall: wallCopy } = useWallCopy();
  const { eventName, eventHashtag } = useWallSettings();
  const tint = useThemedStyles(themed);
  return (
    <View style={styles.bar} testID="wall-header">
      <View style={styles.brand}>
        <HeaderLogo
          url={logoUrl}
          image={logo}
          source={LOGO}
          height={size.logoHeight}
          inkLeft={BRAND_INK_LEFT}
          label={eventName}
          imageID="wall-logo"
        />
        <YearMark />
        {venue ? (
          <Text style={styles.venue} numberOfLines={1}>
            {venue}
          </Text>
        ) : null}
        {badge ? (
          <>
            <View style={styles.divider} />
            <BadgeChip label={badge} />
          </>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.hashtag, tint.hashtag]}>{eventHashtag}</Text>
        {total > 0 && (
          <View
            style={styles.count}
            accessible
            accessibilityLabel={`${total} ${wallCopy.moments(total)}`}
          >
            <PopNumber value={total} style={styles.countNumber} />
            <Text style={styles.countLabel}>{wallCopy.moments(total)}</Text>
          </View>
        )}
        {!ended && <LivePill status={status} label={notice} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The header zone: everything centred on one line, the logo's ink on the safe line.
  bar: {
    alignItems: "center",
    flexDirection: "row",
    height: HEADER.height,
    justifyContent: "space-between",
    left: HEADER.left,
    position: "absolute",
    top: HEADER.top,
    width: HEADER.width,
    zIndex: layer.chrome,
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm + 2,
  },
  venue: { color: color.textSecondary, fontSize: fontSize.caption, maxWidth: size.logoHeight * 3 },
  divider: {
    backgroundColor: color.border,
    height: space.lg,
    width: 1,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.lg,
  },
  hashtag: {
    fontSize: fontSize.lead,
    fontWeight: fontWeight.heavy,
  },
  count: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 2,
  },
  countNumber: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: fontWeight.heavy,
  },
  countLabel: {
    color: color.textSecondary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});

/** The accent on the event hashtag. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    hashtag: { color: colors.brandPrimaryText },
  }),
);

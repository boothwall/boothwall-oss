import type { EventPresentation } from "@boothwall/shared";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import lockup from "#assets/brand/lockup.png";
import { useWallCopy } from "#copy";
import { HEADER } from "#features/wall/constants/layout";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import type { FeedStatus } from "#features/wall/state/connectionPhase";
import { imageSource } from "#foundation/assets";
import { color, fontSize, fontWeight, layer, size, space } from "#foundation/tokens";

import { EventTitle } from "./EventTitle";
import { HeaderLogo, LOCKUP_INK_LEFT } from "./HeaderLogo";
import { HeaderMeta } from "./HeaderMeta";

const LOCKUP = imageSource(lockup);

export type SplitHeaderProps = {
  presentation: EventPresentation;
  total: number;
  status: FeedStatus;
  ended?: boolean;
  notice?: string;
};

/**
 * The split header: the lockup (assets/brand/lockup.png) says whose wall this is, then the event
 * on two rows across the header. The title, large, with the hashtag at the far end of its row;
 * under them the venue, and the photo count with Live at the far end. Without a logo
 * (`logoUrl: null`) the event's name is the title; otherwise its wordmark stands in for it.
 */
export function SplitHeader({
  presentation: { badge, venue, logoUrl },
  total,
  status,
  ended = false,
  notice,
}: SplitHeaderProps) {
  const { wall: wallCopy } = useWallCopy();
  const { eventName, eventHashtag, eventYear } = useWallSettings();
  const [room, setRoom] = useState(0);
  return (
    <View style={styles.bar} testID="wall-header">
      <HeaderLogo
        image={lockup}
        source={LOCKUP}
        height={size.lockupHeight}
        inkLeft={LOCKUP_INK_LEFT}
        label={wallCopy.lockup}
        imageID="wall-lockup"
      />
      <View style={styles.divider} />
      <View style={styles.rows}>
        <View
          style={[styles.column, styles.event, !venue && styles.centred]}
          onLayout={(event) => setRoom(event.nativeEvent.layout.width)}
        >
          <View style={[styles.titleRow, !venue && styles.alone]}>
            <EventTitle
              name={eventName}
              year={eventYear}
              logoUrl={logoUrl}
              badge={badge}
              room={room}
            />
          </View>
          {venue ? (
            <View style={styles.infoRow}>
              <Text style={styles.venue} numberOfLines={1}>
                {venue}
              </Text>
            </View>
          ) : null}
        </View>
        <HeaderMeta
          hashtag={eventHashtag}
          total={total}
          status={status}
          ended={ended}
          notice={notice}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The header zone: the lockup, the divider and the two rows share one band, the mark's height.
  bar: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md - 2,
    height: HEADER.height,
    left: HEADER.left,
    position: "absolute",
    top: HEADER.top,
    width: HEADER.width,
    zIndex: layer.chrome,
  },
  divider: {
    backgroundColor: color.border,
    height: size.headerBand,
    width: 1,
  },
  rows: {
    flex: 1,
    flexDirection: "row",
    gap: space.lg,
    height: size.headerBand,
  },
  // The event on the left, the hashtag and the count on the right: each column spans the band.
  column: {
    height: size.headerBand,
  },
  event: {
    flex: 1,
  },
  // Without a venue the title has the band to itself and sits in its middle.
  centred: {
    justifyContent: "center",
  },
  // Fixed line boxes: Vega grows a row past its text otherwise.
  titleRow: {
    alignItems: "baseline",
    flexDirection: "row",
    height: size.eventTitleLine,
    marginTop: -size.eventTitleLift,
  },
  alone: {
    marginTop: 0,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    height: size.eventLine,
    marginTop: -size.eventLineLift,
  },
  venue: {
    color: color.textSecondary,
    flexShrink: 1,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    lineHeight: size.eventLine,
  },
});

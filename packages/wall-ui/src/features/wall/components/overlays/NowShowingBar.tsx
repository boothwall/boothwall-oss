import { type PhotoDTO, printedCategory } from "@boothwall/shared";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { FOOTER } from "#features/wall/constants/layout";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { formatRelative } from "#features/wall/utils/formatRelative";
import { color, fontSize, fontWeight, layer, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { ProgressLine } from "../primitives/ProgressLine";
import { Announcement } from "./Announcement";
import { FooterCounter } from "./FooterCounter";

export type NowShowingBarProps = {
  /** The photo the wall is on right now; null on an empty wall. */
  photo: PhotoDTO | null;
  position: number;
  total: number;
  durationMs: number;
  cycleKey: string;
  paused: boolean;
  /**
   * The countdown ends with the next photo opening full screen: an accent cue says so, unless an
   * announcement holds the row, which keeps its full width.
   */
  opensNext?: boolean;
};

/**
 * The bar under the photos: the photo on now (caption, category, how long ago) and "n / N", with
 * a thin line under them counting down to the next photo. While the hosts have an announcement
 * up it takes the caption's place as a full-width bar with an accent edge and label, so the wall
 * never shows two footers and the room can't miss it.
 */
export const NowShowingBar = memo(function NowShowingBar({
  photo,
  position,
  total,
  durationMs,
  cycleKey,
  paused,
  opensNext = false,
}: NowShowingBarProps) {
  const { wall: wallCopy } = useWallCopy();
  const { announcement, categories } = useWallSettings();
  const look = useWallLook();
  const tint = useThemedStyles(themed);
  const split = look.header === "split";
  if (!photo && !announcement) return null;
  const meta = photo
    ? [printedCategory(categories, photo.tribe), formatRelative(photo.createdAt)]
        .filter(Boolean)
        .join("  ·  ")
    : "";
  const cue = Boolean(photo) && opensNext && !paused && !announcement;

  return (
    <View style={styles.bar} pointerEvents="none" testID="wall-now-showing">
      <View style={styles.row}>
        {announcement ? (
          <Announcement key={announcement} text={announcement} />
        ) : (
          photo && (
            <>
              <Text style={styles.caption} numberOfLines={1}>
                {photo.caption ?? wallCopy.noCaption}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            </>
          )
        )}
        {cue && (
          <Text
            style={[styles.opensNext, tint.opensNext]}
            numberOfLines={1}
            testID="wall-opens-next"
          >
            {wallCopy.opensNext}
          </Text>
        )}
        {split ? (
          <View style={[styles.status, cue && styles.counterAfterCue]}>
            {photo && (
              <FooterCounter
                style={[styles.counter, styles.counterLarge]}
                text={paused ? wallCopy.paused : wallCopy.counter(position, total)}
                total={paused ? null : total}
              />
            )}
          </View>
        ) : (
          photo && (
            <Text
              style={[
                styles.counter,
                cue && styles.counterAfterCue,
                Boolean(announcement) && look.announcement === "filled" && styles.counterLarge,
              ]}
              numberOfLines={1}
            >
              {paused ? wallCopy.paused : wallCopy.counter(position, total)}
            </Text>
          )
        )}
      </View>
      {photo && (
        <ProgressLine
          width={FOOTER.width}
          durationMs={durationMs}
          cycleKey={cycleKey}
          paused={paused}
          thickness={size.stripLine}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    gap: space.xs + 1,
    height: FOOTER.height,
    justifyContent: "flex-end",
    left: FOOTER.left,
    position: "absolute",
    top: FOOTER.top,
    width: FOOTER.width,
    zIndex: layer.footer,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm + 2,
  },
  caption: {
    color: color.textPrimary,
    flexShrink: 1,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  meta: {
    color: color.textMuted,
    flex: 1,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  // The beat's cue: the brand accent, the counter's size and weight, so it reads from the room.
  opensNext: {
    fontSize: fontSize.caption + 1,
    fontWeight: fontWeight.heavy,
    marginLeft: "auto",
  },
  counterAfterCue: {
    marginLeft: space.md,
  },
  // Live and the counter, together at the row's end, a little apart from the announcement.
  status: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md - space.xs,
    marginLeft: "auto",
    paddingLeft: space.xs + 2,
  },
  // The counter carries the photo count once the split header drops it.
  counterLarge: {
    fontSize: fontSize.lead,
  },
  counter: {
    color: color.textSecondary,
    fontSize: fontSize.caption + 1,
    fontVariant: ["tabular-nums"],
    fontWeight: fontWeight.heavy,
    marginLeft: "auto",
  },
});

/** The opens-next cue in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    opensNext: { color: colors.brandPrimaryText },
  }),
);

import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { useAnnouncementEnter } from "#features/wall/hooks/useAnnouncementEnter";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { useReducedMotion } from "#platform/motion";
import { color, fontSize, fontWeight, radius, size, space, tracking } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { FilledAnnouncement } from "./FilledAnnouncement";

/** The hosts' line, in the classic look or filled (`wall.announcement` in boothwall.config.ts). */
export function Announcement({ text }: { text: string }) {
  return useWallLook().announcement === "filled" ? (
    <FilledAnnouncement text={text} />
  ) : (
    <ClassicAnnouncement text={text} />
  );
}

/**
 * The classic line: the boldest thing in the footer. It rises into place when it changes (or
 * just fades in, with reduced motion).
 */
function ClassicAnnouncement({ text }: { text: string }) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const enter = useAnnouncementEnter(useReducedMotion());
  const style = { opacity: enter.opacity, transform: [{ translateY: enter.rise }] };
  return (
    <Animated.View
      style={[styles.announcement, tint.announcement, style]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.accent, tint.accent]} />
      <Text style={[styles.announcementLabel, tint.announcementLabel]}>
        {wallCopy.announcementLabel}
      </Text>
      <Text style={styles.announcementText} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  );
}

// No box around the photo line: plain text on the backdrop with the progress as a thin line
// under it, so it takes little room from the photos. The announcement is the one pill.

// A bar of the footer's own make, not a sticker: the panel surface, an accent edge on the left,
// a small accent label and the hosts' line in the footer's largest type.
const styles = StyleSheet.create({
  announcement: {
    alignItems: "center",
    borderRadius: radius.control,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: space.sm + 2,
    overflow: "hidden",
    paddingRight: space.md,
    paddingVertical: size.announcementPadY,
  },
  accent: {
    alignSelf: "stretch",
    width: size.announcementAccent,
  },
  announcementLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  announcementText: {
    color: color.textPrimary,
    flexShrink: 1,
    fontSize: fontSize.lead,
    fontWeight: fontWeight.heavy,
  },
});

/** The announcement's edge, bar and label in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    announcement: { backgroundColor: colors.surfaceSolid, borderColor: colors.joinBorder },
    accent: { backgroundColor: colors.brandPrimary },
    announcementLabel: { color: colors.brandPrimaryText },
  }),
);

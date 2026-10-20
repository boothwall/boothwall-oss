import React, { useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import sheen from "#assets/effects/announcement-sheen.png";
import megaphone from "#assets/icons/megaphone.png";
import { useWallCopy } from "#copy";
import { ANNOUNCEMENT_CUE } from "#features/wall/constants/timing";
import { useAnnouncementCue } from "#features/wall/hooks/useAnnouncementCue";
import { useAnnouncementEnter } from "#features/wall/hooks/useAnnouncementEnter";
import { imageSource } from "#foundation/assets";
import { useReducedMotion } from "#foundation/motion";
import { themedStyles, useThemedStyles } from "#foundation/theme";
import { color, fontSize, fontWeight, radius, size, space, tracking } from "#foundation/tokens";

import { AccentRings } from "../primitives/BreathingGlow";

const SHEEN = imageSource(sheen);
const MEGAPHONE = imageSource(megaphone);
/** The sheen's box reaches past the bar above and below, so its slant crosses the whole height. */
const SHEEN_REACH = (size.announcementSheenHeight - size.announcementBar) / 2;

/**
 * The filled announcement: the accent owns the row, with a megaphone in a dark disc and the line
 * at callout size; no label, the megaphone says what it is. Once it has risen into place, and
 * every minute after, it lifts, its rings glow, a sheen crosses it and the megaphone nods. With
 * reduced motion only the rings glow.
 */
export function FilledAnnouncement({ text }: { text: string }) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const reduced = useReducedMotion();
  const enter = useAnnouncementEnter(reduced);
  const cue = useAnnouncementCue();
  // Built once per value: a new animated node on each render makes native-driven motion jump.
  const motion = useMemo(() => {
    const at = (outputRange: number[] | string[]) =>
      cue.interpolate({ inputRange: ANNOUNCEMENT_CUE.steps, outputRange });
    const lift = at(ANNOUNCEMENT_CUE.lift.map((share) => share * size.announcementLift));
    return {
      bar: {
        opacity: enter.opacity,
        transform: [{ translateY: reduced ? enter.rise : Animated.add(enter.rise, lift) }],
      },
      rings: { opacity: at(ANNOUNCEMENT_CUE.rings) },
      sheen: { transform: [{ translateX: at(ANNOUNCEMENT_CUE.sheenX) }] },
      nod: reduced
        ? undefined
        : {
            transform: [
              { rotate: at(ANNOUNCEMENT_CUE.nod) },
              { scale: at(ANNOUNCEMENT_CUE.nodScale) },
            ],
          },
    };
  }, [cue, enter, reduced]);

  return (
    <Animated.View
      style={[styles.announcement, motion.bar]}
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={wallCopy.announcementSpoken(text)}
      testID="wall-announcement-filled"
    >
      <AccentRings corner={radius.control} style={motion.rings} />
      <View style={[styles.bar, tint.bar]}>
        {!reduced && (
          <Animated.Image source={SHEEN} style={[styles.sheen, motion.sheen]} testID="wall-sheen" />
        )}
        <View style={[styles.disc, tint.disc]}>
          <Animated.Image
            source={MEGAPHONE}
            style={[styles.megaphone, tint.megaphone, motion.nod]}
          />
        </View>
        <Text style={[styles.text, tint.text]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  announcement: {
    flex: 1,
    height: size.announcementBar,
  },
  bar: {
    alignItems: "center",
    borderRadius: radius.control,
    flexDirection: "row",
    gap: space.sm + 1,
    height: size.announcementBar,
    overflow: "hidden",
    paddingLeft: (size.announcementBar - size.announcementDisc) / 2 + 1,
    paddingRight: space.md,
  },
  sheen: {
    height: size.announcementSheenHeight,
    left: 0,
    position: "absolute",
    tintColor: color.paper,
    top: -SHEEN_REACH,
    width: size.announcementSheenWidth,
  },
  disc: {
    alignItems: "center",
    borderRadius: size.announcementDisc / 2,
    height: size.announcementDisc,
    justifyContent: "center",
    width: size.announcementDisc,
  },
  megaphone: {
    height: size.announcementGlyph,
    width: size.announcementGlyph,
  },
  text: {
    flexShrink: 1,
    fontSize: fontSize.callout,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.callout,
  },
});

/** The bar in the accent, the line on it, the megaphone in the accent on the canvas. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    bar: { backgroundColor: colors.brandPrimary },
    text: { color: colors.onBrandPrimary },
    disc: { backgroundColor: colors.canvas },
    megaphone: { tintColor: colors.brandPrimary },
  }),
);

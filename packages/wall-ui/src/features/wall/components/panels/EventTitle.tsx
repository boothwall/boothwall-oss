import React, { useMemo, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";

import logo from "#assets/brand/logo.png";
import { fitTitleSize } from "#features/wall/utils/fitTitle";
import { imageSource, useImageSize } from "#foundation/assets";
import { themedStyles, useThemedStyles } from "#foundation/theme";
import { CANVAS_WIDTH, color, fontSize, fontWeight, size, tracking } from "#foundation/tokens";

import { BadgeChip } from "./BadgeChip";
import { CapBox } from "./CapBox";
import { HeaderLogo } from "./HeaderLogo";

const LOGO = imageSource(logo);
/** An event's wordmark runs wide; a 926×150 one is about 6:1. */
const EVENT_LOGO_MAX_ASPECT = 8;
const MAX = fontSize.eventTitle;
/**
 * The size of the bundled BoothWall logo (brand/logos/boothwall-on-dark.svg rendered 168 px tall).
 * The lockup beside the title already says BoothWall, so this one never stands in for the event.
 */
const BRAND_LOGO = { width: 792, height: 168 };

export type EventTitleProps = {
  name: string;
  year?: string;
  /**
   * The event's wordmark in the name's place: undefined draws the bundled logo.png when it is the
   * event's own (not BoothWall's), null the name.
   */
  logoUrl?: string | null;
  badge?: string;
  /** The width the title may take. */
  room: number;
};

const widthOf = (event: LayoutChangeEvent) => event.nativeEvent.layout.width;

/**
 * The event's name (or wordmark) and year, large, with the badge after them, all one height: the
 * wordmark and the badge span the title's caps. A title too long for `room` steps down 1 dp at a
 * time to the TV's floor, then the name truncates; the year never does. Text is measured once at
 * the full size in a hidden copy, as Vega can't fit text itself.
 */
export function EventTitle({ name, year, logoUrl, badge, room }: EventTitleProps) {
  const tint = useThemedStyles(themed);
  const [text, setText] = useState(0);
  const [logoAspect, setLogoAspect] = useState(0);
  const [badgeWidth, setBadgeWidth] = useState(0);
  const bundled = useImageSize(logo);
  const ownBundled =
    bundled !== null &&
    (bundled.width !== BRAND_LOGO.width || bundled.height !== BRAND_LOGO.height);
  const wordmark = typeof logoUrl === "string" || (logoUrl === undefined && ownBundled);
  const logoAtMax = wordmark ? logoAspect * size.eventLogoEm * MAX : 0;
  const yearGapAtMax = wordmark && year ? size.eventYearGapEm * MAX : 0;
  const fit = fitTitleSize(
    room,
    { scalable: text + logoAtMax + yearGapAtMax, badge: badge ? badgeWidth : 0 },
    { max: MAX, min: fontSize.eventTitleMin, badgeGapEm: size.eventBadgeGapEm },
  );
  const sized = useMemo(
    () => ({
      row: { gap: fit * size.eventYearGapEm },
      text: { fontSize: fit },
      badge: { marginLeft: fit * size.eventBadgeGapEm },
      cap: fit * size.eventCapEm,
    }),
    [fit],
  );

  return (
    <View style={[styles.title, sized.row]}>
      {wordmark ? (
        <CapBox
          height={sized.cap}
          onWidth={(width) => setLogoAspect(width / (fit * size.eventLogoEm))}
        >
          <HeaderLogo
            url={logoUrl}
            image={logo}
            source={LOGO}
            height={fit * size.eventLogoEm}
            maxAspect={EVENT_LOGO_MAX_ASPECT}
            label={name}
            imageID="wall-logo"
          />
        </CapBox>
      ) : (
        <Text style={[styles.name, sized.text]} numberOfLines={1}>
          {name}
        </Text>
      )}
      {year ? <Text style={[styles.year, tint.accent, sized.text]}>{year}</Text> : null}
      {badge ? (
        <View style={sized.badge}>
          <CapBox height={sized.cap} onWidth={setBadgeWidth}>
            <BadgeChip label={badge} height={sized.cap} />
          </CapBox>
        </View>
      ) : null}
      <View style={styles.measure} pointerEvents="none" aria-hidden>
        <View style={styles.measured} onLayout={(event) => setText(widthOf(event))}>
          {wordmark ? null : <Text style={styles.name}>{name}</Text>}
          {year ? <Text style={styles.year}>{year}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    alignItems: "baseline",
    flexDirection: "row",
    flexShrink: 1,
    height: size.eventTitleLine,
  },
  name: {
    color: color.textPrimary,
    flexShrink: 1,
    fontSize: MAX,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.callout,
    lineHeight: size.eventTitleLine,
  },
  year: {
    flexShrink: 0,
    fontSize: MAX,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.label,
    lineHeight: size.eventTitleLine,
  },
  // Off-screen and wide enough that the copy never wraps.
  measure: {
    left: 0,
    opacity: 0,
    position: "absolute",
    top: 0,
    width: CANVAS_WIDTH * 4,
  },
  measured: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: MAX * size.eventYearGapEm,
  },
});

/** The year in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    accent: { color: colors.brandPrimaryText },
  }),
);

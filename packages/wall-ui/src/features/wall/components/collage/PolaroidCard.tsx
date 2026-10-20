import { type PhotoDTO, printedCategory } from "@boothwall/shared";
import React, { memo, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useWallCopy } from "#copy";
import { CAPTION_LOOKS } from "#features/wall/constants/captionStyles";
import { POLAROID_TYPE } from "#features/wall/constants/layout";
import { useWallSettings } from "#features/wall/hooks/useWallSettings";
import { fitCaption } from "#features/wall/utils/fitCaption";
import { photoSource } from "#features/wall/utils/photoSource";
import { metaLineExtent, POLAROID_PAPER } from "#features/wall/utils/polaroidGeometry";
import { usePixelDensity } from "#platform/display";
import { color, size, space } from "#theme/tokens";

import { PolaroidImage } from "./PolaroidImage";
import { PolaroidMeta } from "./PolaroidMeta";

export type PolaroidCardProps = {
  photo: PhotoDTO;
  width: number;
  onImageLoad?: () => void;
  /**
   * A card lifted above the wall (the selection, the spotlight): a real blurred shadow and the
   * category and hashtag line. Wall cards get a soft fake shadow instead (a dozen blurred
   * shadows moving every frame is too much for a Stick) and only their caption.
   */
  raised?: boolean;
  /**
   * Instead of `raised`, a card being lifted off the wall: 0 draws it exactly like a wall card,
   * 1 like a raised one. The shadows crossfade and the category line fades in on a strip of
   * paper hung below the card, so the card's own size never changes (a lifted copy that is
   * taller than its original from the first frame jumps).
   */
  lift?: Animated.Value | Animated.AnimatedInterpolation<number>;
};

export const PolaroidCard = memo(function PolaroidCard({
  photo,
  width,
  onImageLoad,
  raised = false,
  lift,
}: PolaroidCardProps) {
  const { wall: wallCopy } = useWallCopy();
  const pad = width * POLAROID_PAPER.edge;
  const imageSize = width - pad * 2;
  // The thumbnail while it is sharp enough where the wall is drawn, else the original.
  const uri = photoSource(photo, imageSize, usePixelDensity());
  const unit = width / POLAROID_TYPE.baseWidth;
  const caption = photo.caption ?? wallCopy.noCaption;
  const { captionStyle, categories, eventHashtag } = useWallSettings();
  const look = CAPTION_LOOKS[captionStyle];
  // One line, shrunk to fit like a hand-written polaroid; two only for a caption too long.
  const {
    text: captionText,
    lines,
    size: captionSize,
  } = fitCaption(caption, imageSize / unit, {
    max: POLAROID_TYPE.caption.max * look.scale,
    smallest: POLAROID_TYPE.caption.min * look.scale,
    twoLineMax: POLAROID_TYPE.caption.twoLineMax * look.scale,
    charWidth: look.charWidth / look.scale,
  });
  // Nothing for the catch-all ("Just visiting") or a category that was removed.
  const category = printedCategory(categories, photo.tribe);
  const metaLine = (
    <PolaroidMeta category={category} hashtag={eventHashtag} unit={unit} fixedHeight={!!lift} />
  );
  const resting = useMemo(
    () => lift?.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: "clamp" }),
    [lift],
  );
  // The paper the category line adds: from just under the caption to the new foot.
  const extent = metaLineExtent(width);
  const foot = width * POLAROID_PAPER.foot;

  return (
    <View style={{ width }}>
      {!raised && <Animated.View style={[styles.plateOuter, resting && { opacity: resting }]} />}
      {!raised && <Animated.View style={[styles.plateInner, resting && { opacity: resting }]} />}
      {lift && (
        <Animated.View
          style={[styles.liftShadow, styles.raised, { bottom: -extent, opacity: lift }]}
        />
      )}
      <View style={[styles.card, raised && styles.raised, { padding: pad, paddingBottom: foot }]}>
        <PolaroidImage
          uri={uri}
          size={imageSize}
          unit={unit}
          label={eventHashtag}
          onLoad={onImageLoad}
        />
        <Text
          style={[
            styles.caption,
            {
              fontSize: captionSize * unit,
              // A two-line caption steps by its font's leading, so its lines read as one.
              lineHeight:
                lines === 1 ? POLAROID_TYPE.captionLine * unit : captionSize * unit * look.leading,
              marginTop: width * POLAROID_PAPER.captionGap,
              fontFamily: look.fontFamily,
              fontWeight: look.fontWeight,
              letterSpacing: (look.letterSpacing ?? 0) * unit,
              textShadowOffset: { width: look.thicken * unit, height: 0 },
            },
          ]}
          numberOfLines={lines}
        >
          {captionText}
        </Text>
        {/* Only on lifted cards, which are big enough to read: the selection's category and
            the event hashtag under its caption. */}
        {raised && metaLine}
      </View>
      {lift && (
        <Animated.View
          style={[
            styles.metaStrip,
            { bottom: -extent, height: foot + extent, paddingHorizontal: pad, opacity: lift },
          ]}
        >
          {metaLine}
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.paper,
    borderRadius: space.xs,
  },
  // Behind a lifting card, down to its category line: the raised shadow, faded in.
  liftShadow: {
    backgroundColor: color.paper,
    borderRadius: space.xs,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  // Over the card's foot and below it: paper carrying the category line, faded in.
  metaStrip: {
    backgroundColor: color.paper,
    borderBottomLeftRadius: space.xs,
    borderBottomRightRadius: space.xs,
    left: 0,
    position: "absolute",
    right: 0,
  },
  raised: {
    elevation: 8,
    shadowColor: color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  // Two faint, slightly larger plates fake a soft shadow: no blur pass, and no hard slab.
  plateOuter: {
    backgroundColor: color.cardShadowOuter,
    borderRadius: space.xs + size.shadowSpread,
    bottom: -size.shadowSpread - 1,
    left: -size.shadowSpread,
    position: "absolute",
    right: -size.shadowSpread,
    top: -size.shadowSpread + 2,
  },
  plateInner: {
    backgroundColor: color.cardShadowInner,
    borderRadius: space.xs + 1,
    bottom: -2,
    left: -1,
    position: "absolute",
    right: -1,
    top: 1,
  },
  // The font comes from the caption style. The shadow is the style's faux bold, if any.
  caption: {
    color: color.paperInk,
    textShadowColor: color.paperInk,
    textShadowRadius: 0,
    textAlign: "center",
  },
});

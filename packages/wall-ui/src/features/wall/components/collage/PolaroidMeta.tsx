import React from "react";
import { StyleSheet, Text } from "react-native";

import { POLAROID_TYPE } from "#features/wall/constants/layout";
import { color } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

type PolaroidMetaProps = {
  /** None for the catch-all ("Just visiting") or a category that was removed. */
  category: string | null;
  hashtag: string;
  /** The card's scale against its base width. */
  unit: number;
  /** On a card being lifted the line keeps a fixed height, so the strip under it never jumps. */
  fixedHeight?: boolean;
};

/** The category and the event hashtag under a lifted card's caption. */
export function PolaroidMeta({ category, hashtag, unit, fixedHeight = false }: PolaroidMetaProps) {
  const tint = useThemedStyles(themed);
  return (
    <Text
      style={[
        styles.meta,
        {
          fontSize: POLAROID_TYPE.meta * unit,
          letterSpacing: POLAROID_TYPE.metaTracking * unit,
          marginTop: POLAROID_TYPE.metaGap * unit,
        },
        fixedHeight && { lineHeight: POLAROID_TYPE.metaLine * unit },
      ]}
      numberOfLines={1}
    >
      {category && <Text style={tint.categoryDot}>{"● "}</Text>}
      {category && <Text style={tint.categoryLabel}>{category}</Text>}
      {category && <Text style={styles.separator}>{"  ·  "}</Text>}
      <Text style={tint.hashtag}>{hashtag}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: color.paperInkMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  separator: {
    color: color.paperInkMuted,
  },
});

/** The category and hashtag on the paper. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    // The darker on-paper shade, so the dot holds 3:1 on the cream card, like its label.
    categoryDot: { color: colors.brandSecondaryOnPaper },
    categoryLabel: { color: colors.brandSecondaryOnPaper },
    hashtag: { color: colors.brandPrimaryOnPaper },
  }),
);

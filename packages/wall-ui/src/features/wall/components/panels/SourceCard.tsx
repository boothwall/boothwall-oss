import { boothwallConfig } from "@boothwall/shared";
import React, { memo } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";

import githubMark from "#assets/icons/github-mark.png";
import { useWallCopy } from "#copy";
import { useWallLook } from "#features/wall/hooks/useWallLook";
import { imageSource } from "#platform/assets";
import { useWallConnection, useWallPresentation } from "#platform/connection";
import { color, fontSize, fontWeight, radius, size, space } from "#theme/tokens";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

import { QrCode } from "../primitives/QrCode";
import { RepoSourceCard } from "./RepoSourceCard";

const GITHUB_MARK = imageSource(githubMark);

export type SourceCardProps = {
  /** Where it sits: in the panel's flow, or laid over Who's here while it takes its turn. */
  style?: ViewStyle;
};

/**
 * The source card: the classic credit, or the repo card when `wall.source` names the repo.
 * Memoised: its QR is a few hundred views that never change, so wall ticks skip it.
 */
export const SourceCard = memo(function SourceCard({ style }: SourceCardProps) {
  const { source } = useWallLook();
  return source ? <RepoSourceCard source={source} style={style} /> : <CreditCard style={style} />;
});

/**
 * The open-source credit: what it is, what you get (this wall, free, at your own event) and a QR
 * to the code, in one compact row at the foot of the panel.
 */
function CreditCard({ style }: SourceCardProps) {
  const { wall: wallCopy } = useWallCopy();
  const defaults = useWallConnection();
  const { sourceUrl = defaults.sourceUrl, sourceLabel = defaults.sourceLabel } =
    useWallPresentation();
  const custom =
    sourceUrl !== boothwallConfig.urls.source || sourceLabel !== boothwallConfig.author.handle;
  const { title, body } = wallCopy.author;
  const tint = useThemedStyles(themed);
  return (
    <View
      style={[styles.card, tint.card, style]}
      accessible
      accessibilityLabel={sourceLabel}
      testID="wall-source"
    >
      <View style={styles.qrFrame}>
        <QrCode value={sourceUrl} size={size.sourceQr} errorCorrection="L" />
      </View>
      <View style={styles.text}>
        <View style={styles.head}>
          {custom ? (
            <Text style={styles.title} accessible={false}>
              ↗
            </Text>
          ) : (
            <Image source={GITHUB_MARK} style={styles.mark} accessible={false} />
          )}
          <Text style={styles.title} numberOfLines={1}>
            {custom ? sourceLabel : title}
          </Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {custom ? sourceUrl.replace(/^https?:\/\//, "") : body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm + 2,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.sm,
  },
  head: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  mark: {
    height: size.sourceMark,
    width: size.sourceMark,
  },
  title: {
    color: color.textPrimary,
    flexShrink: 1,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
  },
  qrFrame: {
    backgroundColor: color.paper,
    borderRadius: space.sm,
    padding: space.xs,
  },
  text: {
    flex: 1,
    gap: 1,
  },
});

/** The card in the theme's tone. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surfaceSolid },
  }),
);

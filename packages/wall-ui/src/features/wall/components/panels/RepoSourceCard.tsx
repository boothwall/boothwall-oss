import { type BoothwallConfig, boothwallConfig, type WallLook } from "@boothwall/shared";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";

import githubMark from "#assets/icons/github-mark.png";
import { useWallCopy } from "#copy";
import { fitFontSize } from "#features/wall/utils/fitFontSize";
import { qrAddress } from "#features/wall/utils/qrAddress";
import { imageSource } from "#foundation/assets";
import { themedStyles, useThemedStyles } from "#foundation/theme";
import { color, fontSize, fontWeight, radius, size, space, tracking } from "#foundation/tokens";

import { QrCode } from "../primitives/QrCode";

const GITHUB_MARK = imageSource(githubMark);

export type RepoSourceCardProps = {
  source: NonNullable<WallLook["source"]>;
  style?: ViewStyle;
};

/**
 * The source card for a room of developers, kept quiet beside the photos: the repo's name beside
 * the host's mark, then a big QR straight to the code with why to scan and the license. The owner
 * is left to the QR and the read-out label, so the name never truncates.
 */
export function RepoSourceCard({ source, style }: RepoSourceCardProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const qr = useMemo(() => qrAddress((boothwallConfig as BoothwallConfig).urls.source), []);
  const name = source.repo.slice(source.repo.indexOf("/") + 1);
  const github = /^github\.com$/i.test(source.host ?? "");
  const nameSize = fitFontSize(name, size.repoHeroWidth - (github ? size.repoMark : 0), {
    max: fontSize.body,
    min: fontSize.fine,
    charWidth: 0.6,
  });
  const { title, pitch } = wallCopy.author;
  return (
    <View
      style={[styles.card, tint.card, style]}
      accessible
      accessibilityLabel={`${title}: ${source.repo}`}
      testID="wall-source"
    >
      <View style={styles.hero}>
        {github && <Image source={GITHUB_MARK} style={styles.mark} accessible={false} />}
        <Text style={[styles.name, { fontSize: nameSize }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.foot}>
        <View style={styles.qrFrame}>
          <QrCode value={qr} size={size.repoQr} errorCorrection="L" />
        </View>
        <View style={styles.text}>
          <Text style={[styles.eyebrow, tint.eyebrow]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.pitch} numberOfLines={3}>
            {pitch.charAt(0).toUpperCase() + pitch.slice(1)}
          </Text>
          {source.license ? (
            <Text style={styles.license} numberOfLines={1}>
              {source.license}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingBottom: space.sm,
    paddingHorizontal: space.sm + 1,
    paddingTop: space.sm - 1,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 1,
  },
  mark: {
    height: size.repoMark,
    width: size.repoMark,
  },
  name: {
    color: color.textPrimary,
    flexShrink: 1,
    fontWeight: fontWeight.bold,
  },
  foot: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm + 1,
    marginTop: "auto",
  },
  qrFrame: {
    backgroundColor: color.paper,
    borderRadius: size.repoQrRadius,
    padding: size.repoQrPad,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: fontSize.fine,
    fontWeight: fontWeight.heavy,
  },
  pitch: {
    color: color.textSecondary,
    fontSize: fontSize.fine,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.fine + 3,
  },
  license: {
    color: color.textMuted,
    fontSize: fontSize.fine,
    fontWeight: fontWeight.bold,
    letterSpacing: tracking.label,
  },
});

/** The card in the theme's tone, the eyebrow in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surfaceSolid },
    eyebrow: { color: colors.brandPrimaryText },
  }),
);

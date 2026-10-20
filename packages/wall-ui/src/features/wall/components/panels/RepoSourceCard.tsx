import { type BoothwallConfig, boothwallConfig, type WallLook } from "@boothwall/shared";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";

import githubMark from "#assets/icons/github-mark.png";
import { useWallCopy } from "#copy";
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
 * The source card for a room of developers: "Open source", the repo's name as the hero, and a
 * QR straight to the code beside the host, the license and why to scan. No address is printed.
 */
export function RepoSourceCard({ source, style }: RepoSourceCardProps) {
  const { wall: wallCopy } = useWallCopy();
  const tint = useThemedStyles(themed);
  const qr = useMemo(() => qrAddress((boothwallConfig as BoothwallConfig).urls.source), []);
  const cut = source.repo.indexOf("/") + 1;
  const { title, pitch } = wallCopy.author;
  return (
    <View
      style={[styles.card, tint.card, style]}
      accessible
      accessibilityLabel={`${title}: ${source.repo}`}
      testID="wall-source"
    >
      <Text style={[styles.eyebrow, tint.eyebrow]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.repo} numberOfLines={1}>
        <Text style={styles.owner}>{source.repo.slice(0, cut)}</Text>
        {source.repo.slice(cut)}
      </Text>
      <View style={styles.foot}>
        <View style={styles.qrFrame}>
          <QrCode value={qr} size={size.repoQr} errorCorrection="L" />
        </View>
        <View style={styles.text}>
          {source.host ? (
            <View style={styles.host}>
              {/^github\.com$/i.test(source.host) && (
                <Image source={GITHUB_MARK} style={styles.mark} accessible={false} />
              )}
              <Text style={styles.hostName} numberOfLines={1}>
                {source.host}
              </Text>
            </View>
          ) : null}
          <Text style={styles.line} numberOfLines={2}>
            {source.license ? (
              <>
                <Text style={styles.license}>{source.license}</Text> ·{" "}
              </>
            ) : null}
            {source.line ?? pitch}
          </Text>
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
    paddingTop: space.sm + 1,
  },
  eyebrow: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  repo: {
    color: color.textPrimary,
    fontSize: fontSize.callout,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.callout,
    marginTop: 1,
  },
  owner: {
    color: color.textSecondary,
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
  },
  host: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 1,
  },
  mark: {
    height: size.repoMark,
    opacity: 0.85,
    width: size.repoMark,
  },
  hostName: {
    color: color.textMuted,
    flexShrink: 1,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  line: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  license: {
    color: color.textPrimary,
    fontWeight: fontWeight.heavy,
  },
});

/** The card in the theme's tone, the eyebrow in the accent. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surfaceSolid },
    eyebrow: { color: colors.brandPrimaryText },
  }),
);

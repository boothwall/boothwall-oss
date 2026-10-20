import React, { memo, useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { IMAGE_RETRY_MS } from "#features/wall/constants/timing";
import { themedStyles, useThemedStyles } from "#theme/wallTheme";

type PolaroidImageProps = {
  uri: string;
  /** The square photo's side, in dp. */
  size: number;
  /** The card's scale against its base width; the placeholder's type follows it. */
  unit: number;
  /** What a photo that never loads shows instead: the event hashtag. */
  label: string;
  onLoad?: () => void;
};

/**
 * The photo on the card. A failed load (flaky booth Wi-Fi) remounts the Image a couple of times
 * before giving up on a placeholder in the accent.
 */
export const PolaroidImage = memo(function PolaroidImage({
  uri,
  size,
  unit,
  label,
  onLoad,
}: PolaroidImageProps) {
  const tint = useThemedStyles(themed);
  // A fresh `{ uri }` object on every render can make the native image view reload and flash.
  const source = useMemo(() => ({ uri }), [uri]);
  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  const retryIn = errored ? IMAGE_RETRY_MS[attempt] : undefined;
  const failed = errored && retryIn === undefined;
  useEffect(() => {
    if (retryIn === undefined) return;
    const timer = setTimeout(() => {
      setErrored(false);
      setAttempt((n) => n + 1);
    }, retryIn);
    return () => clearTimeout(timer);
  }, [retryIn]);

  if (failed) {
    return (
      <View style={[styles.placeholder, tint.placeholder, { width: size, height: size }]}>
        <Text style={[styles.placeholderText, tint.placeholderText, { fontSize: 14 * unit }]}>
          {label}
        </Text>
      </View>
    );
  }
  return (
    <Image
      key={attempt}
      source={source}
      style={{ width: size, height: size, borderRadius: 2 }}
      onLoad={onLoad}
      onError={() => {
        setErrored(true);
        // Out of retries: reveal the card with its placeholder.
        if (attempt >= IMAGE_RETRY_MS.length) onLoad?.();
      }}
    />
  );
});

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    borderRadius: 2,
    justifyContent: "center",
  },
  placeholderText: {
    fontWeight: "800",
  },
});

/** The failed photo's fill. */
const themed = themedStyles((colors) =>
  StyleSheet.create({
    placeholder: { backgroundColor: colors.brandSecondary },
    placeholderText: { color: colors.onBrandSecondary },
  }),
);

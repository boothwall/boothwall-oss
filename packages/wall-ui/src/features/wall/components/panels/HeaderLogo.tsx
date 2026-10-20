import React, { useEffect, useMemo, useState } from "react";
import { Image, type ImageSourcePropType } from "react-native";

import { type BundledImage, useArtwork, useImageAspect } from "#foundation/assets";

/**
 * The bundled logo's transparent margin left of the mark, as a share of its height (6 of 168 px),
 * so the ink, not the file, sits on the safe line.
 */
export const BRAND_INK_LEFT = 6 / 168;
/** The same for the bundled OSS lockup, rendered from the kit's SVG with its margin (10 of 288 px). */
export const LOCKUP_INK_LEFT = 10 / 288;

export type HeaderLogoProps = {
  /** A custom image; undefined draws the bundled one, null draws nothing. */
  url?: string | null;
  /** The bundled image, as imported and as a source built once. */
  image: BundledImage;
  source: ImageSourcePropType;
  height: number;
  /** The bundled image's transparent margin left of its ink, as a share of its height. */
  inkLeft?: number;
  label: string;
  /** The image's test id. */
  imageID: string;
  /** The widest a custom image may be, as width over height, so a stray file can't fill the bar. */
  maxAspect?: number;
};

/** Pixel sizes from the native or the web load event, or nothing when they make no sense. */
function loadedAspect(event: unknown): number | undefined {
  const loaded = (event as { nativeEvent: unknown }).nativeEvent as {
    source?: { width?: number; height?: number };
    target?: { naturalWidth?: number; naturalHeight?: number };
  };
  const width = loaded.source?.width ?? loaded.target?.naturalWidth;
  const height = loaded.source?.height ?? loaded.target?.naturalHeight;
  if (typeof width !== "number" || typeof height !== "number") return undefined;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return undefined;
  return width / height;
}

/**
 * A logo at a fixed height in the header: its width follows the image's own aspect ratio. On
 * the web a custom image's ratio arrives once it has loaded; until then it takes no room.
 */
export function HeaderLogo({
  url,
  image,
  source,
  height,
  inkLeft = 0,
  label,
  imageID,
  maxAspect = 4,
}: HeaderLogoProps) {
  const art = useArtwork(url, source);
  const [remoteAspect, setRemoteAspect] = useState<{ url: string; ratio: number }>();
  // The web's load event carries no pixel size, so ask for it; the load event still covers native.
  useEffect(() => {
    if (!art.custom || !url) return;
    let current = true;
    Image.getSize(
      url,
      (width, height) => {
        if (current && width > 0 && height > 0) setRemoteAspect({ url, ratio: width / height });
      },
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [art.custom, url]);
  const aspect = useImageAspect(image);
  const displayAspect = art.custom
    ? remoteAspect && remoteAspect.url === url
      ? remoteAspect.ratio
      : 2
    : aspect;
  const style = useMemo(
    () => ({
      height,
      width: height * (art.custom ? Math.min(displayAspect ?? 0, maxAspect) : (displayAspect ?? 0)),
      marginLeft: art.custom ? 0 : -height * inkLeft,
    }),
    [art.custom, displayAspect, height, inkLeft, maxAspect],
  );
  if (!art.source) return null;
  return (
    <Image
      source={art.source}
      onError={art.onError}
      onLoad={(event) => {
        if (!art.custom || !url) return;
        const ratio = loadedAspect(event);
        if (ratio !== undefined) setRemoteAspect({ url, ratio });
      }}
      style={style}
      resizeMode="contain"
      accessibilityLabel={label}
      testID={imageID}
    />
  );
}

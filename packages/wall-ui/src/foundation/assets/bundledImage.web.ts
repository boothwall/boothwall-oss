import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

/** Vite imports an image as its URL. */
export type BundledImage = string;

export const imageSource = (image: BundledImage): ImageSourcePropType => ({ uri: image });

export const imageUri = (image: BundledImage): string => image;

/** The browser's image element, as far as the probe below needs it (the package has no DOM lib). */
type DomImage = {
  onload: (() => void) | null;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
};

/**
 * Vite doesn't know image sizes, so the aspect is read once the browser has loaded it. Through
 * the DOM, not React Native's Image: this file sits on the DOM-only pages' path (`./tokens`).
 */
export function useImageAspect(image: BundledImage): number | null {
  const size = useImageSize(image);
  return size && size.width / size.height;
}

/** The image's pixel size, once the browser has loaded it. */
export function useImageSize(image: BundledImage): { width: number; height: number } | null {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    let live = true;
    const probe = new (globalThis as unknown as { Image: new () => DomImage }).Image();
    probe.onload = () => {
      if (live) setSize({ width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.src = image;
    return () => {
      live = false;
    };
  }, [image]);
  return size;
}

import { useMemo, useState } from "react";
import type { ImageSourcePropType } from "react-native";

/** Null deliberately hides artwork; a failed custom URL falls back to bundled art. */
export function useArtwork(url: string | null | undefined, fallback: ImageSourcePropType) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const custom = typeof url === "string" && url !== failedUrl;
  const source = useMemo(
    () => (url === null ? null : custom ? { uri: url } : fallback),
    [url, custom, fallback],
  );
  return {
    source,
    custom,
    onError: () => {
      if (custom) setFailedUrl(url);
    },
  };
}

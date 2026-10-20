import { type EventPresentation, resolveEventPresentation } from "@boothwall/shared";
import { useMemo } from "react";

import { useWallSettings } from "#features/wall/hooks/useWallSettings";

import { useWallConnection } from "./wallConnection";

/** Received event settings override the application shell's standalone defaults. */
export function useWallPresentation(): EventPresentation {
  const connection = useWallConnection();
  const { presentation } = useWallSettings();
  return useMemo(() => {
    const resolved = resolveEventPresentation(
      {
        sourceUrl: connection.sourceUrl,
        sourceLabel: connection.sourceLabel,
        showSourceOnWall: connection.showSource,
        badge: connection.badge,
        venue: connection.venue,
        ...connection.presentation,
      },
      presentation,
    );
    const absolute = (url: string | null | undefined) =>
      url?.startsWith("/")
        ? new URL(`${connection.apiBaseUrl.replace(/\/+$/, "")}${url}`).href
        : url;
    return {
      ...resolved,
      logoUrl: absolute(resolved.logoUrl),
      backdropUrl: absolute(resolved.backdropUrl),
    };
  }, [connection, presentation]);
}

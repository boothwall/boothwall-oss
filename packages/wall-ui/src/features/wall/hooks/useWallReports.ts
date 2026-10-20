import type { PhotoDTO } from "@boothwall/shared";
import { useEffect } from "react";

type WallReports = {
  onPausedChange?: (paused: boolean) => void;
  onSpotlightChange?: (open: boolean) => void;
  onPhotosChange?: (photos: readonly PhotoDTO[]) => void;
};

type ReportedWall = { pool: readonly PhotoDTO[] };

/** Tells the host about playback, the spotlight and the wall's approved photos. */
export function useWallReports(
  reports: WallReports,
  paused: boolean,
  spotlightOpen: boolean,
  wall: ReportedWall,
) {
  const { onPausedChange, onSpotlightChange, onPhotosChange } = reports;
  useEffect(() => {
    onPhotosChange?.(wall.pool);
  }, [onPhotosChange, wall.pool]);
  useEffect(() => {
    onPausedChange?.(paused);
  }, [onPausedChange, paused]);
  useEffect(() => {
    onSpotlightChange?.(spotlightOpen);
  }, [onSpotlightChange, spotlightOpen]);
}

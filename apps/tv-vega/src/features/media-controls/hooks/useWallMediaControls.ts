import { useKeplerAppStateManager } from "@amazon-devices/react-native-kepler";
import { boothwallConfig } from "@boothwall/shared";
import { useMemo } from "react";

import type { MediaControlFocus } from "@/features/keep-awake";
import { mediaCommandsFor } from "@/features/media-controls/data/mediaCommands";
import { WallMediaControlHandler } from "@/features/media-controls/data/wallMediaHandler";
import { wallInput } from "@/features/wall-input";

export function useWallMediaControls(): MediaControlFocus {
  const manager = useKeplerAppStateManager();
  return useMemo(
    () => ({
      componentInstance: manager.getComponentInstance(),
      handler: new WallMediaControlHandler(mediaCommandsFor(wallInput), boothwallConfig.event),
    }),
    [manager],
  );
}

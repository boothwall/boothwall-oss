import type { PhotoDTO } from "@boothwall/shared";
import { usePhotoCallState, useRemoteHintState, type WallScreenProps } from "@boothwall/wall-ui";
import { useEffect, useMemo, useState } from "react";

import type { EventRuntime } from "#runtime";

type MomentRequests = Pick<
  WallScreenProps,
  "onPhotosChange" | "onPausedChange" | "onPhotoCallRequest" | "onHintsRequest"
>;

export interface WallMomentsState {
  /** What the wall screen reports and asks for, to hand to WallScreen. */
  requests: MomentRequests;
  photoCall: ReturnType<typeof usePhotoCallState>;
  hint: ReturnType<typeof useRemoteHintState>;
  paused: boolean;
  /** A keyboard can end the call early (Escape); a phone just lets it run out. */
  keyboard: boolean;
}

/**
 * The photo call and the remote help card on the browser wall, when the runtime offers them
 * (`wallMoments`); null otherwise, and the wall ignores those requests. The host's phone opens
 * a call and asking again ends it; asking for help while a call runs does nothing, as on the TV.
 */
export function useWallMoments(
  offered: EventRuntime["wallMoments"],
  keyboard: boolean,
): WallMomentsState | null {
  const [photos, setPhotos] = useState<readonly PhotoDTO[]>([]);
  const [paused, setPaused] = useState(false);
  const photoCall = usePhotoCallState(photos);
  const hint = useRemoteHintState();
  const callOpen = photoCall.call !== null;
  const { toggle } = photoCall;
  const { show: showHint, hide: hideHint } = hint;
  useEffect(() => {
    if (callOpen) hideHint();
  }, [callOpen, hideHint]);

  const photoCallOffered = offered?.photoCall ?? false;
  const remoteHelpOffered = offered?.remoteHelp ?? false;
  const requests = useMemo<MomentRequests>(
    () => ({
      onPhotosChange: setPhotos,
      onPausedChange: setPaused,
      onPhotoCallRequest: photoCallOffered ? toggle : undefined,
      onHintsRequest: remoteHelpOffered && !callOpen ? showHint : undefined,
    }),
    [callOpen, photoCallOffered, remoteHelpOffered, showHint, toggle],
  );
  if (!photoCallOffered && !remoteHelpOffered) return null;
  return { requests, photoCall, hint, paused, keyboard };
}

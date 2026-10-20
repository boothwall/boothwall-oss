import type { WallLook } from "@boothwall/shared";
import {
  missionFor,
  photoCallCopy,
  PhotoCallFinale,
  PhotoCallOverlay,
  RemoteHintOverlay,
  SignalCallBurst,
  useWallSettings,
  useWallTheme,
} from "@boothwall/wall-ui";

import type { WallMomentsState } from "#features/wall/hooks";

interface WallMomentsProps {
  moments: WallMomentsState;
  demo: boolean;
  look?: WallLook;
  joinUrl: string;
}

/**
 * The TV app's photo call and remote help card, drawn over the browser wall in its live colours
 * (inside WallScreen's `overlay`). A click on the help card closes it, like any key.
 */
export function WallMoments({ moments, demo, look, joinUrl }: WallMomentsProps) {
  const { colors } = useWallTheme();
  const { categories } = useWallSettings();
  const { photoCall, hint, paused, keyboard } = moments;
  const { call } = photoCall;

  return (
    <>
      {hint.open && (
        <div
          key={hint.opened}
          className="absolute inset-0"
          data-testid="wall-remote-help"
          onPointerDown={hint.hide}
        >
          <RemoteHintOverlay demo={demo} paused={paused} colors={colors} />
        </div>
      )}
      {call?.finale && (
        <PhotoCallFinale finale={call.finale} colors={colors} onEnd={photoCall.close} />
      )}
      {call && !call.finale && (
        <PhotoCallOverlay
          endsAt={call.endsAt}
          mission={missionFor(categories, call.index)}
          newPhotos={photoCall.newPhotos}
          joinUrl={joinUrl}
          colors={colors}
          onEnd={photoCall.finish}
          backHint={keyboard ? photoCallCopy.escape : null}
        />
      )}
      {call && !call.finale && look?.motion === "signal" && <SignalCallBurst key={call.endsAt} />}
    </>
  );
}

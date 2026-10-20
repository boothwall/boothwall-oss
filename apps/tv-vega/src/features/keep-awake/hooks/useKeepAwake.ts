import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { KEEP_AWAKE_START_MS } from "../constants/keep-awake.constants";
import { createSilentAudio, type MediaControlFocus, type SilentAudio } from "../data/silentAudio";

/**
 * Keeps the Vega screensaver away while the app is in the foreground.
 *
 * Vega has no keep-awake API. It only holds off the screensaver for an app with an
 * audio or video playback session, so the wall loops a silent track while it's in the
 * foreground and pauses it in the background, where the screensaver works as usual. The player
 * starts a few seconds after launch, once the wall has had its turn.
 */
export function useKeepAwake(mediaControls?: MediaControlFocus) {
  useEffect(() => {
    let audio: SilentAudio | null = null;
    let disposed = false;

    const sync = (state: AppStateStatus) => {
      if (state === "active") audio?.play();
      else audio?.pause();
    };

    const start = setTimeout(() => {
      createSilentAudio(mediaControls)
        .then((created) => {
          if (disposed) {
            created.release();
            return;
          }
          audio = created;
          sync(AppState.currentState);
        })
        .catch((error: unknown) => console.warn("[keep-awake] audio setup failed", error));
    }, KEEP_AWAKE_START_MS);

    const subscription = AppState.addEventListener("change", sync);
    return () => {
      disposed = true;
      clearTimeout(start);
      subscription.remove();
      audio?.release();
    };
  }, [mediaControls]);
}

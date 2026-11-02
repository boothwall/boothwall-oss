import {
  LIFESPAN_POLICY,
  useSetLifespanCallback,
  useSetTimeoutCallback,
} from "@amazon-devices/react-native-kepler";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { KEEP_AWAKE_START_MS, KEEP_AWAKE_TIMEOUT_SECS } from "../constants/keep-awake.constants";
import { createSilentAudio, type MediaControlFocus, type SilentAudio } from "../data/silentAudio";

/**
 * Keeps the Vega screensaver away while the app is in the foreground.
 *
 * Vega has no keep-awake API. It holds the display for an audio or video playback session, and
 * separately backgrounds a foreground component that has been inactive for `timeout-secs` (the
 * system default when the manifest omits it) with no crash report. The wall plays a silent
 * track while it's in the foreground, pauses it in the background, and asks LCM for a permanent
 * lifespan with a year-long inactivity timeout. The player starts a few seconds after launch,
 * once the wall has had its turn.
 */
export function useKeepAwake(mediaControls?: MediaControlFocus) {
  const setLifespan = useSetLifespanCallback();
  const setInactivityTimeout = useSetTimeoutCallback();

  useEffect(() => {
    try {
      setLifespan(LIFESPAN_POLICY.PERMANENT);
      setInactivityTimeout(KEEP_AWAKE_TIMEOUT_SECS);
    } catch (error: unknown) {
      // 4K Select logs that TimeoutManager is unsupported. The manifest fields still apply.
      console.warn("[keep-awake] could not set foreground lifespan", error);
    }
  }, [setLifespan, setInactivityTimeout]);

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

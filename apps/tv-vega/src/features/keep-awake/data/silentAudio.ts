import { AudioPlayer } from "@amazon-devices/react-native-w3cmedia";
import { Image } from "react-native";

import { KEEP_AWAKE_REWIND_MIN_MS, KEEP_AWAKE_STALL_MS } from "../constants/keep-awake.constants";

// Five minutes of silent 8 kbps mono MP3. Vega documents HTMLMediaElement.loop as
// unsupported, and w3cmedia's loop handler calls play() at end-of-stream without seeking
// to 0 while swallowing `ended`, so the playback session would die with this file.
// The player below seeks back itself.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SILENCE = require("./silence.mp3");

/** Hands the session's media commands (remote media keys, Alexa) to the app. */
export interface MediaControlFocus {
  componentInstance: Parameters<AudioPlayer["setMediaControlFocus"]>[0];
  handler: NonNullable<Parameters<AudioPlayer["setMediaControlFocus"]>[1]>;
}

export interface SilentAudio {
  play: () => void;
  pause: () => void;
  release: () => void;
}

/** A silent audio player. While it plays, the app holds an audio-playback session. */
export async function createSilentAudio(mediaControls?: MediaControlFocus): Promise<SilentAudio> {
  const player = new AudioPlayer();
  // Vega's media controls guide sets focus before the player initialises.
  if (mediaControls) {
    await player
      .setMediaControlFocus(mediaControls.componentInstance, mediaControls.handler)
      .catch((error: unknown) => console.warn("[keep-awake] media controls unavailable", error));
  }
  await player.initialize();
  // Leave loop off so `ended` is delivered. The library consumes that event when loop is set.
  player.loop = false;
  // The player opens a plain file path; it fails on a file:// URL.
  player.src = Image.resolveAssetSource(SILENCE).uri.replace(/^file:\/\//, "");

  let wantPlay = false;
  let restarting = false;
  let lastRewind = 0;
  let lastTime: number | undefined;
  let stallTimer: ReturnType<typeof setInterval> | undefined;

  const rewind = () => {
    if (!wantPlay || restarting) return;
    const now = Date.now();
    if (now - lastRewind < KEEP_AWAKE_REWIND_MIN_MS) return;
    restarting = true;
    lastRewind = now;
    lastTime = undefined;
    try {
      player.currentTime = 0;
    } catch (error: unknown) {
      console.warn("[keep-awake] seek failed", error);
    }
    player.play().catch((error: unknown) => console.warn("[keep-awake] play failed", error));
    restarting = false;
  };

  player.addEventListener("ended", rewind);
  player.addEventListener("error", () => {
    console.warn("[keep-awake] audio error", player.error);
    rewind();
  });

  // A session that dies without `ended` (the loop handler used to swallow it) stops moving
  // the playhead. Restart before the screensaver's five minutes are up.
  const watch = () => {
    if (!wantPlay) return;
    let time = Number.NaN;
    try {
      time = player.currentTime;
    } catch (error: unknown) {
      console.warn("[keep-awake] playhead unreadable", error);
      rewind();
      return;
    }
    const stuck = player.ended || Number.isNaN(time) || time === lastTime;
    const quiet = player.paused && time === lastTime;
    lastTime = time;
    if (stuck || quiet) rewind();
  };

  return {
    play: () => {
      wantPlay = true;
      lastTime = undefined;
      if (player.ended) rewind();
      else player.play().catch((error: unknown) => console.warn("[keep-awake] play failed", error));
      stallTimer ??= setInterval(watch, KEEP_AWAKE_STALL_MS);
    },
    pause: () => {
      wantPlay = false;
      player.pause();
    },
    release: () => {
      wantPlay = false;
      if (stallTimer !== undefined) clearInterval(stallTimer);
      stallTimer = undefined;
      player.pause();
      player.deinitialize().catch(() => undefined);
    },
  };
}

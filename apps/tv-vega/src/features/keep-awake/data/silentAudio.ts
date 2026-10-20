import { AudioPlayer } from "@amazon-devices/react-native-w3cmedia";
import { Image } from "react-native";

// Five minutes of silent 8 kbps mono MP3, played on a loop. A long file means the
// playback session only restarts every five minutes, when the loop wraps.
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

/** A looping, silent audio player. While it plays, the app holds an audio-playback session. */
export async function createSilentAudio(mediaControls?: MediaControlFocus): Promise<SilentAudio> {
  const player = new AudioPlayer();
  // Vega's media controls guide sets focus before the player initialises.
  if (mediaControls) {
    await player
      .setMediaControlFocus(mediaControls.componentInstance, mediaControls.handler)
      .catch((error: unknown) => console.warn("[keep-awake] media controls unavailable", error));
  }
  await player.initialize();
  player.addEventListener("error", () => console.warn("[keep-awake] audio error", player.error));
  player.loop = true;
  // The player opens a plain file path; it fails on a file:// URL.
  player.src = Image.resolveAssetSource(SILENCE).uri.replace(/^file:\/\//, "");
  return {
    play: () => {
      player.play().catch((error: unknown) => console.warn("[keep-awake] play failed", error));
    },
    pause: () => player.pause(),
    release: () => {
      player.pause();
      player.deinitialize().catch(() => undefined);
    },
  };
}

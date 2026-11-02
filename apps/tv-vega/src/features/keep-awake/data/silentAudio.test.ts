import { Image } from "react-native";

import { KEEP_AWAKE_STALL_MS } from "../constants/keep-awake.constants";
import { createSilentAudio } from "./silentAudio";

jest.mock("./silence.mp3", () => 1, { virtual: true });

type Listener = () => void;

interface FakePlayer {
  loop: boolean;
  src: string;
  currentTime: number;
  paused: boolean;
  ended: boolean;
  error: { code: number } | null;
  initialize: jest.Mock;
  play: jest.Mock;
  pause: jest.Mock;
  deinitialize: jest.Mock;
  emit: (name: string) => void;
}

jest.mock("@amazon-devices/react-native-w3cmedia", () => {
  class FakePlayer {
    loop = true;
    src = "";
    currentTime = 0;
    paused = true;
    ended = false;
    error: { code: number } | null = null;
    private listeners: Record<string, Listener[]> = {};
    initialize = jest.fn(async () => undefined);
    setMediaControlFocus = jest.fn(async () => undefined);
    play = jest.fn(async () => {
      this.paused = false;
      this.ended = false;
    });
    pause = jest.fn(() => {
      this.paused = true;
    });
    deinitialize = jest.fn(async () => undefined);
    addEventListener = (name: string, listener: Listener) => {
      (this.listeners[name] ??= []).push(listener);
    };
    emit(name: string) {
      for (const listener of this.listeners[name] ?? []) listener();
    }
  }
  const players: FakePlayer[] = [];
  return {
    AudioPlayer: jest.fn(() => {
      const player = new FakePlayer();
      players.push(player);
      return player;
    }),
    players,
  };
});

const createdPlayers = () =>
  (jest.requireMock("@amazon-devices/react-native-w3cmedia") as { players: FakePlayer[] }).players;

beforeEach(() => {
  createdPlayers().length = 0;
  jest.useFakeTimers();
  jest.spyOn(Image, "resolveAssetSource").mockReturnValue({
    uri: "file:///opt/silence.mp3",
    width: 0,
    height: 0,
    scale: 1,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("does not use the unsupported loop flag, and strips file:// from the asset path", async () => {
  const audio = await createSilentAudio();
  const player = createdPlayers()[0]!;
  expect(player.loop).toBe(false);
  expect(player.src).toBe("/opt/silence.mp3");
  audio.release();
});

it("seeks to the start and plays again when the file ends", async () => {
  const audio = await createSilentAudio();
  const player = createdPlayers()[0]!;
  audio.play();
  player.play.mockClear();
  player.currentTime = 300;
  player.ended = true;
  player.emit("ended");
  expect(player.currentTime).toBe(0);
  expect(player.play).toHaveBeenCalledTimes(1);
  audio.release();
});

it("does not rewind again when ended fires a second time immediately", async () => {
  const audio = await createSilentAudio();
  const player = createdPlayers()[0]!;
  audio.play();
  player.play.mockClear();
  player.ended = true;
  player.emit("ended");
  player.ended = true;
  player.emit("ended");
  expect(player.play).toHaveBeenCalledTimes(1);
  audio.release();
});

it("restarts a session whose playhead has stopped while the wall still wants audio", async () => {
  const audio = await createSilentAudio();
  const player = createdPlayers()[0]!;
  audio.play();
  player.play.mockClear();
  player.currentTime = 12;
  player.paused = false;
  player.ended = false;
  jest.advanceTimersByTime(KEEP_AWAKE_STALL_MS);
  expect(player.play).not.toHaveBeenCalled();
  player.paused = true;
  jest.advanceTimersByTime(KEEP_AWAKE_STALL_MS);
  expect(player.currentTime).toBe(0);
  expect(player.play).toHaveBeenCalledTimes(1);
  audio.release();
});

it("does not restart after pause, and releases the player", async () => {
  const audio = await createSilentAudio();
  const player = createdPlayers()[0]!;
  audio.play();
  audio.pause();
  player.play.mockClear();
  player.ended = true;
  player.emit("ended");
  jest.advanceTimersByTime(KEEP_AWAKE_STALL_MS);
  expect(player.play).not.toHaveBeenCalled();
  audio.release();
  expect(player.deinitialize).toHaveBeenCalledTimes(1);
});

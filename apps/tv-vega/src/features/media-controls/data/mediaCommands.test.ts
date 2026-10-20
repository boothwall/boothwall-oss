import type { WallInputState } from "@/features/wall-input";

import { mediaCommandsFor } from "./mediaCommands";

function wall(paused: boolean) {
  const handlers = { playpause: jest.fn(), right: jest.fn(), left: jest.fn() };
  const state: WallInputState = { handlers, paused, onCaptured: null };
  return { handlers, commands: mediaCommandsFor(state), state };
}

describe("mediaCommandsFor", () => {
  it("pauses and plays only when that changes the slideshow", () => {
    const playing = wall(false);
    playing.commands.play();
    expect(playing.handlers.playpause).not.toHaveBeenCalled();
    playing.commands.pause();
    expect(playing.handlers.playpause).toHaveBeenCalledTimes(1);

    const paused = wall(true);
    paused.commands.pause();
    expect(paused.handlers.playpause).not.toHaveBeenCalled();
    paused.commands.play();
    expect(paused.handlers.playpause).toHaveBeenCalledTimes(1);
  });

  it("reads the latest state and handlers at command time", () => {
    const { commands, state } = wall(false);
    const later = { playpause: jest.fn(), right: jest.fn(), left: jest.fn() };
    state.handlers = later;
    state.paused = true;
    commands.play();
    commands.next();
    commands.previous();
    commands.toggle();
    expect(later.playpause).toHaveBeenCalledTimes(2);
    expect(later.right).toHaveBeenCalledTimes(1);
    expect(later.left).toHaveBeenCalledTimes(1);
  });

  it("does nothing before the wall has registered its handlers", () => {
    const commands = mediaCommandsFor({ handlers: null, paused: false, onCaptured: null });
    expect(() => {
      commands.pause();
      commands.next();
    }).not.toThrow();
  });

  it("only closes an overlay that owns the remote, then reaches the wall again", () => {
    const { handlers, commands, state } = wall(false);
    const close = jest.fn();
    state.onCaptured = close;
    commands.pause();
    commands.toggle();
    commands.next();
    commands.previous();
    expect(close).toHaveBeenCalledTimes(4);
    expect(handlers.playpause).not.toHaveBeenCalled();
    expect(handlers.right).not.toHaveBeenCalled();
    expect(handlers.left).not.toHaveBeenCalled();

    state.onCaptured = null;
    commands.next();
    expect(handlers.right).toHaveBeenCalledTimes(1);
  });
});

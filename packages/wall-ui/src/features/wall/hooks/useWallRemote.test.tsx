import React from "react";
import { BackHandler } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import type { RemoteCommands } from "./useWallDirector";
import { useWallRemote } from "./useWallRemote";

const commands: RemoteCommands = {
  left: jest.fn(),
  right: jest.fn(),
  select: jest.fn(),
  back: jest.fn(),
  playpause: jest.fn(),
};

function backPress(hostBack: boolean) {
  let press: (() => boolean | null | undefined) | undefined;
  const add = jest.spyOn(BackHandler, "addEventListener").mockImplementation((_, handler) => {
    press = handler;
    return { remove: () => undefined };
  });
  const exit = jest.spyOn(BackHandler, "exitApp").mockImplementation(() => undefined);
  function Probe() {
    useWallRemote(commands, false, () => undefined, hostBack);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe />);
  });
  const restore = () => {
    act(() => renderer.unmount());
    add.mockRestore();
    exit.mockRestore();
  };
  return { press: () => press!(), exit, restore };
}

it("leaves the hardware Back to a host that owns it and never arms an exit", () => {
  const back = backPress(true);
  expect(back.press()).toBe(false);
  expect(back.press()).toBe(false);
  expect(back.exit).not.toHaveBeenCalled();
  back.restore();
});

it("still takes two presses to exit the open wall", () => {
  const back = backPress(false);
  act(() => void back.press());
  expect(back.exit).not.toHaveBeenCalled();
  act(() => void back.press());
  expect(back.exit).toHaveBeenCalledTimes(1);
  back.restore();
});

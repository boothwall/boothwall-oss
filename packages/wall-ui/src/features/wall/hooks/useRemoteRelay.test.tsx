import type { RemoteMessage, WallTheme } from "@boothwall/shared";
import React, { type RefObject } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { type HostRequests, useRemoteRelay } from "./useRemoteRelay";
import type { RemoteCommands } from "./wall-director.types";

function relay(requests: HostRequests = {}, shown: WallTheme = "party") {
  const right = jest.fn();
  const commands = { current: { right } } as unknown as RefObject<RemoteCommands>;
  let send!: (message: RemoteMessage) => void;
  function Probe() {
    send = useRemoteRelay(commands, requests, { current: shown });
    return null;
  }
  act(() => {
    TestRenderer.create(<Probe />);
  });
  return { send, right };
}

it("sends host messages to the host and every button to the wall", () => {
  const photocall = jest.fn();
  const hints = jest.fn();
  const { send, right } = relay({ onPhotoCallRequest: photocall, onHintsRequest: hints });
  send("photocall");
  send("hints");
  send("right");
  expect(photocall).toHaveBeenCalledTimes(1);
  expect(hints).toHaveBeenCalledTimes(1);
  expect(right).toHaveBeenCalledTimes(1);
});

it("asks the host for the next theme, telling it the one on screen", () => {
  const theme = jest.fn();
  const photocall = jest.fn();
  const { send, right } = relay(
    { onThemeRequest: theme, onPhotoCallRequest: photocall },
    "wedding",
  );
  send("theme");
  expect(theme).toHaveBeenCalledWith("wedding");
  expect(photocall).not.toHaveBeenCalled();
  expect(right).not.toHaveBeenCalled();
});

it("ignores a host message the host doesn't offer", () => {
  const { send, right } = relay();
  expect(() => send("photocall")).not.toThrow();
  expect(() => send("hints")).not.toThrow();
  expect(() => send("theme")).not.toThrow();
  expect(right).not.toHaveBeenCalled();
});

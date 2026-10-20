import type { RemoteHandlers } from "@boothwall/wall-ui";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { wallInput } from "@/features/wall-input/state/wallInput";
import { WallInputContext } from "@/features/wall-input/state/WallInputContext";

import { useWallRemoteInput } from "./useWallRemoteInput";

jest.mock("@/platform/input", () => ({ useVegaRemote: () => undefined }));

const handlers: RemoteHandlers = { playpause: jest.fn() };

function Probe() {
  useWallRemoteInput(handlers);
  return null;
}

const render = (captured: boolean) => (
  <WallInputContext.Provider value={{ captured }}>
    <Probe />
  </WallInputContext.Provider>
);

const mount = (captured: boolean) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(render(captured));
  });
  return tree;
};

it("hands the wall's handlers to media keys only while nothing has the screen", () => {
  const open = mount(false);
  expect(wallInput.handlers).toBe(handlers);
  act(() => open.unmount());
  expect(wallInput.handlers).toBeNull();

  const captured = mount(true);
  expect(wallInput.handlers).toBeNull();
  act(() => captured.unmount());
});

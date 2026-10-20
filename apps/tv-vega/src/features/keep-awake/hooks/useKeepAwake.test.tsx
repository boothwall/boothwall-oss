import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { KEEP_AWAKE_START_MS } from "../constants/keep-awake.constants";
import { useKeepAwake } from "./useKeepAwake";

const mockAudio = { play: jest.fn(), pause: jest.fn(), release: jest.fn() };
const mockCreate = jest.fn(() => Promise.resolve(mockAudio));
jest.mock("../data/silentAudio", () => ({ createSilentAudio: () => mockCreate() }));

function Probe() {
  useKeepAwake();
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it("starts the silent player a few seconds after launch, not on the first render", () => {
  act(() => {
    TestRenderer.create(<Probe />);
  });
  expect(mockCreate).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(KEEP_AWAKE_START_MS));
  expect(mockCreate).toHaveBeenCalledTimes(1);
});

it("never starts it when the wall closes first", () => {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = TestRenderer.create(<Probe />);
  });
  act(() => tree?.unmount());
  act(() => jest.advanceTimersByTime(KEEP_AWAKE_START_MS));
  expect(mockCreate).not.toHaveBeenCalled();
});

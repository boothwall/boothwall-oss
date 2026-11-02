import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { KEEP_AWAKE_START_MS, KEEP_AWAKE_TIMEOUT_SECS } from "../constants/keep-awake.constants";
import { useKeepAwake } from "./useKeepAwake";

jest.mock("@amazon-devices/react-native-kepler", () => {
  const setLifespan = jest.fn();
  const setInactivityTimeout = jest.fn();
  return {
    LIFESPAN_POLICY: { PERMANENT: 0 },
    useSetLifespanCallback: () => setLifespan,
    useSetTimeoutCallback: () => setInactivityTimeout,
    setLifespan,
    setInactivityTimeout,
  };
});

const kepler = jest.requireMock("@amazon-devices/react-native-kepler") as {
  LIFESPAN_POLICY: { PERMANENT: number };
  setLifespan: jest.Mock;
  setInactivityTimeout: jest.Mock;
};

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

it("asks the lifecycle manager to leave the foreground component up", () => {
  act(() => {
    TestRenderer.create(<Probe />);
  });
  expect(kepler.setLifespan).toHaveBeenCalledWith(kepler.LIFESPAN_POLICY.PERMANENT);
  expect(kepler.setInactivityTimeout).toHaveBeenCalledWith(KEEP_AWAKE_TIMEOUT_SECS);
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

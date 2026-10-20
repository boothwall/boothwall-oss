import { REMOTE_HINT_MS } from "@boothwall/wall-ui";
import React from "react";
import { BackHandler } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { useRemoteHint } from "./useRemoteHint";

type BackListener = () => boolean | null | undefined;
const backListeners = new Set<BackListener>();
const pressBack = () => [...backListeners].reverse().some((listener) => listener());
const mounted: ReactTestRenderer[] = [];

function mount() {
  const latest: { current?: ReturnType<typeof useRemoteHint> } = {};
  function Probe() {
    latest.current = useRemoteHint();
    return null;
  }
  act(() => {
    mounted.push(TestRenderer.create(<Probe />));
  });
  return latest;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(BackHandler, "addEventListener").mockImplementation((_name, listener) => {
    backListeners.add(listener);
    return { remove: () => backListeners.delete(listener) };
  });
});
afterEach(() => {
  act(() => mounted.splice(0).forEach((tree) => tree.unmount()));
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("useRemoteHint", () => {
  it("stays closed until asked, then opens", () => {
    const hint = mount();
    expect(hint.current?.open).toBe(false);
    act(() => hint.current?.show());
    expect(hint.current).toMatchObject({ open: true, opened: 1 });
  });

  it("closes by itself, and asking again while open starts the time over", () => {
    const hint = mount();
    act(() => hint.current?.show());
    act(() => jest.advanceTimersByTime(REMOTE_HINT_MS - 1000));
    act(() => hint.current?.show());
    act(() => jest.advanceTimersByTime(REMOTE_HINT_MS - 1000));
    expect(hint.current?.open).toBe(true);
    act(() => jest.advanceTimersByTime(1000));
    expect(hint.current?.open).toBe(false);
  });

  it("takes Back only while open: it closes the card and goes no further", () => {
    const hint = mount();
    expect(pressBack()).toBe(false);
    act(() => hint.current?.show());
    let handled = false;
    act(() => {
      handled = pressBack();
    });
    expect(handled).toBe(true);
    expect(hint.current?.open).toBe(false);
    expect(pressBack()).toBe(false);
  });
});

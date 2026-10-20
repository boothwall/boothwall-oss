import type { WallLook } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallLookContext } from "#features/wall/state/wallLookContext";
import { signal } from "#foundation/tokens";

import { FooterCounter } from "./FooterCounter";

function mount(look: WallLook) {
  const at = (total: number) => (
    <WallLookContext.Provider value={look}>
      <FooterCounter text={`2 / ${total}`} total={total} style={{ fontSize: 20 }} />
    </WallLookContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(at(13));
  });
  const json = () => JSON.stringify(renderer.toJSON());
  return {
    renderer,
    tick: () => act(() => renderer.update(at(14))),
    shows: (count: number) => json().includes(`"children":["${count}"]`),
    rings: () => json().split("ring.png").length - 1,
  };
}

describe("FooterCounter", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("is plain text by default; with the signal look the count ticks once the light lands", () => {
    const classic = mount({});
    classic.tick();
    expect(JSON.stringify(classic.renderer.toJSON())).toContain('"children":["2 / 14"]');
    act(() => classic.renderer.unmount());

    const counter = mount({ motion: "signal" });
    counter.tick();
    expect(counter.shows(13)).toBe(true);
    act(() => jest.advanceTimersByTime(signal.counter.delayMs));
    expect(counter.shows(14)).toBe(true);
    expect(counter.rings()).toBe(1);
    act(() => counter.renderer.unmount());
  });
});

import type { WallLook } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallLookContext } from "#features/wall/state/wallLookContext";
import { signal } from "#foundation/tokens";

import { QrSignal } from "./QrSignal";

async function mount(look: WallLook) {
  const at = (total: number) => (
    <WallLookContext.Provider value={look}>
      <QrSignal total={total} />
    </WallLookContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(at(13));
  });
  const drawn = (sprite: string) => JSON.stringify(renderer.toJSON()).split(sprite).length - 1;
  return {
    renderer,
    arrive: () => act(() => renderer.update(at(14))),
    shown: () => ({ pings: drawn("card-ping.png"), sheens: drawn("sheen-blue.png") }),
  };
}

describe("QrSignal", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("pings the join card on a new photo and shimmers it now and then, only with the signal look", async () => {
    const classic = await mount({});
    classic.arrive();
    act(() => jest.advanceTimersByTime(signal.qr.everyMs));
    expect(classic.renderer.toJSON()).toBeNull();
    act(() => classic.renderer.unmount());

    const card = await mount({ motion: "signal" });
    card.arrive();
    expect(card.shown()).toEqual({ pings: 1, sheens: 0 });
    act(() => jest.advanceTimersByTime(signal.qr.everyMs));
    expect(card.shown()).toEqual({ pings: signal.qr.shimmerPings.length, sheens: 1 });
    act(() => card.renderer.unmount());
  });
});

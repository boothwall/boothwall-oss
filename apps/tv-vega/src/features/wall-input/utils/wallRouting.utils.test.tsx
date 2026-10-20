import type { HWEvent } from "@amazon-devices/react-native-kepler";
import type { RemoteHandlers } from "@boothwall/wall-ui";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { mediaCommandsFor } from "@/features/media-controls";
import { useWallRemoteInput } from "@/features/wall-input/hooks/useWallRemoteInput";
import { wallInput } from "@/features/wall-input/state/wallInput";
import { WallInputContext } from "@/features/wall-input/state/WallInputContext";
import { LONG_PRESS_MS } from "@/platform/input/useVegaRemote";

import { type WallMoments, wallRouting } from "./wallRouting.utils";

let deliver: (event: Partial<HWEvent>) => void = () => undefined;
jest.mock("@amazon-devices/react-native-w3cmedia", () => ({ KeplerMediaControlHandler: class {} }));
jest.mock("@amazon-devices/react-native-kepler", () => ({
  useTVEventHandler: (handler: (event: Partial<HWEvent>) => void) => {
    deliver = handler;
  },
}));

const press = (eventType: string) => deliver({ eventType, eventKeyAction: 1 });
const mounted: ReactTestRenderer[] = [];

function mount(state: Partial<WallMoments>) {
  const handlers: RemoteHandlers = { select: jest.fn(), right: jest.fn(), playpause: jest.fn() };
  const moments: WallMoments = {
    demo: false,
    callOpen: false,
    toggleCall: jest.fn(),
    hintOpen: false,
    showHint: jest.fn(),
    hideHint: jest.fn(),
    nextTheme: jest.fn(),
    ...state,
  };
  function Wall() {
    useWallRemoteInput(handlers);
    return null;
  }
  act(() => {
    mounted.push(
      TestRenderer.create(
        <WallInputContext.Provider value={wallRouting(moments)}>
          <Wall />
        </WallInputContext.Provider>,
      ),
    );
  });
  return { handlers, moments };
}

afterEach(() => act(() => mounted.splice(0).forEach((tree) => tree.unmount())));

describe("wallRouting", () => {
  it("lets Menu step the themes in demo mode and open the help otherwise", () => {
    const demo = mount({ demo: true });
    press("menu");
    expect(demo.moments.nextTheme).toHaveBeenCalledTimes(1);
    expect(demo.moments.showHint).not.toHaveBeenCalled();
    act(() => mounted.splice(0).forEach((tree) => tree.unmount()));

    const live = mount({ demo: false });
    press("menu");
    expect(live.moments.showHint).toHaveBeenCalledTimes(1);
  });

  it("while the help is open, any key only closes it: a held OK, Menu, a media command", () => {
    jest.useFakeTimers();
    const { handlers, moments } = mount({ demo: true, hintOpen: true });
    deliver({ eventType: "enter", eventKeyAction: 0 });
    jest.advanceTimersByTime(LONG_PRESS_MS);
    press("enter");
    press("menu");
    press("right");
    mediaCommandsFor(wallInput).toggle();

    expect(moments.hideHint).toHaveBeenCalledTimes(4);
    expect(moments.toggleCall).not.toHaveBeenCalled();
    expect(moments.nextTheme).not.toHaveBeenCalled();
    expect(handlers.select).not.toHaveBeenCalled();
    expect(handlers.right).not.toHaveBeenCalled();
    expect(handlers.playpause).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

import type { HWEvent } from "@amazon-devices/react-native-kepler";
import type { RemoteHandlers } from "@boothwall/wall-ui";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { LONG_PRESS_MS, type RemoteExtras, STALE_HOLD_MS, useVegaRemote } from "./useVegaRemote";

let deliver: (event: Partial<HWEvent>) => void = () => undefined;
jest.mock("@amazon-devices/react-native-kepler", () => ({
  useTVEventHandler: (handler: (event: Partial<HWEvent>) => void) => {
    deliver = handler;
  },
}));

function mount(handlers: RemoteHandlers, extras?: RemoteExtras) {
  function Probe() {
    useVegaRemote(handlers, extras);
    return null;
  }
  act(() => {
    TestRenderer.create(<Probe />);
  });
}

describe("useVegaRemote", () => {
  it("fires once per press, on key up, with the remote's names normalised", () => {
    const select = jest.fn();
    const playpause = jest.fn();
    const left = jest.fn();
    mount({ select, playpause, left });

    deliver({ eventType: "enter", eventKeyAction: 0 });
    expect(select).not.toHaveBeenCalled();
    deliver({ eventType: "enter", eventKeyAction: 1 });
    deliver({ eventType: "center", eventKeyAction: 1 });
    deliver({ eventType: "play_pause", eventKeyAction: 1 });
    deliver({ eventType: "left", eventKeyAction: 1 });

    expect(select).toHaveBeenCalledTimes(2);
    expect(playpause).toHaveBeenCalledTimes(1);
    expect(left).toHaveBeenCalledTimes(1);
  });

  it("ignores keys the wall has no handler for", () => {
    const select = jest.fn();
    mount({ select });
    expect(() => deliver({ eventType: "menu", eventKeyAction: 1 })).not.toThrow();
    expect(select).not.toHaveBeenCalled();
  });

  it("turns a held OK into a long press, without also selecting", () => {
    jest.useFakeTimers();
    const select = jest.fn();
    const onLongSelect = jest.fn();
    mount({ select }, { onLongSelect });

    deliver({ eventType: "enter", eventKeyAction: 0 });
    jest.advanceTimersByTime(LONG_PRESS_MS / 2);
    deliver({ eventType: "enter", eventKeyAction: 0 });
    jest.advanceTimersByTime(LONG_PRESS_MS / 2);
    deliver({ eventType: "enter", eventKeyAction: 1 });
    expect(onLongSelect).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();

    deliver({ eventType: "enter", eventKeyAction: 0 });
    deliver({ eventType: "enter", eventKeyAction: 1 });
    expect(select).toHaveBeenCalledTimes(1);
    expect(onLongSelect).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("starts a fresh press when an earlier key up never arrived", () => {
    jest.useFakeTimers();
    const select = jest.fn();
    const onLongSelect = jest.fn();
    mount({ select }, { onLongSelect });

    deliver({ eventType: "enter", eventKeyAction: 0 });
    jest.advanceTimersByTime(STALE_HOLD_MS * 5);
    deliver({ eventType: "enter", eventKeyAction: 0 });
    deliver({ eventType: "enter", eventKeyAction: 1 });
    expect(select).toHaveBeenCalledTimes(1);
    expect(onLongSelect).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("hands Menu to the app only when it asks for it", () => {
    const onMenu = jest.fn();
    mount({}, { onMenu });
    deliver({ eventType: "menu", eventKeyAction: 0 });
    deliver({ eventType: "menu", eventKeyAction: 1 });
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it("hands every button to an overlay that owns the remote, a held OK and Menu included", () => {
    jest.useFakeTimers();
    const select = jest.fn();
    const onCaptured = jest.fn();
    const onLongSelect = jest.fn();
    const onMenu = jest.fn();
    mount({ select }, { onCaptured, onLongSelect, onMenu });

    deliver({ eventType: "enter", eventKeyAction: 0 });
    jest.advanceTimersByTime(LONG_PRESS_MS);
    deliver({ eventType: "enter", eventKeyAction: 1 });
    deliver({ eventType: "menu", eventKeyAction: 1 });
    deliver({ eventType: "back", eventKeyAction: 1 });
    deliver({ eventType: "left", eventKeyAction: 1 });
    deliver({ eventType: "focus" });
    expect(onCaptured).toHaveBeenCalledTimes(4);
    expect(select).not.toHaveBeenCalled();
    expect(onLongSelect).not.toHaveBeenCalled();
    expect(onMenu).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

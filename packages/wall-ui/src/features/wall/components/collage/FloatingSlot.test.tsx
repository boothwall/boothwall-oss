import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";
import React from "react";
import { Image, StyleSheet } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";

import { TiltedSurface, type TiltedSurfaceProps } from "../primitives/TiltedSurface";
import { FloatingSlot } from "./FloatingSlot";

// Run actual animations in JS so the rendered opacity can be observed deterministically.
jest.mock("#platform/motion", () => ({
  ...jest.requireActual("#platform/motion"),
  NATIVE_DRIVER: false,
}));

const photo = {
  id: "a",
  status: "approved",
  caption: "First photo",
  tribe: "guests",
  thumbUrl: "https://example.test/a/thumb",
  imageUrl: "https://example.test/a/image",
  createdAt: "2026-10-19T06:00:00.000Z",
} as PhotoDTO;
const noop = () => undefined;
const slot = { x: 60, y: 120, rotate: -4, width: 120 };

function mount(delay: number | null) {
  const content = (current: PhotoDTO | null) => (
    <WallSettingsContext.Provider value={DEFAULT_SETTINGS}>
      <FloatingSlot
        photo={current}
        slot={slot}
        drift={undefined}
        zIndex={0}
        swapDelayMs={delay}
        isFresh={false}
        hidden={false}
        onSettled={noop}
      />
    </WallSettingsContext.Provider>
  );
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(content(photo));
  });
  act(() => {
    renderer.root
      .findAllByType(Image)
      .forEach((node) => (node.props.onLoad as (() => void) | undefined)?.());
  });
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  return {
    renderer,
    show: (current: PhotoDTO | null) => act(() => renderer.update(content(current))),
    opacity: () => {
      const surface = renderer.root.findAllByType(TiltedSurface)[0]!;
      const opacity = StyleSheet.flatten(surface.props.style as TiltedSurfaceProps["style"])
        .opacity as unknown as { __getValue(): number };
      return opacity.__getValue();
    },
  };
}

describe("FloatingSlot page return", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([null, 880])(
    "restores a retained card after returning before its exit finishes (delay %s)",
    (delay) => {
      const wall = mount(delay);
      expect(wall.opacity()).toBe(1);
      wall.show(null);
      act(() => {
        jest.advanceTimersByTime(150);
      });
      wall.show(photo);
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(wall.opacity()).toBe(1);
      expect(
        wall.renderer.root
          .findAllByType(Image)
          .some(
            (node) => (node.props.source as { uri?: string } | undefined)?.uri === photo.thumbUrl,
          ),
      ).toBe(true);
      act(() => wall.renderer.unmount());
    },
  );

  it("still removes an outgoing card when its slot stays empty", () => {
    const wall = mount(880);
    wall.show(null);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(wall.renderer.toJSON()).toBeNull();
    act(() => wall.renderer.unmount());
  });
});

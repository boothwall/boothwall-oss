import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";
import React from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";

import { SelectedPhoto } from "./SelectedPhoto";

const photo = {
  id: "p1",
  caption: "Team photo!",
  tribe: "team",
  thumbUrl: "https://example.test/t.jpg",
  imageUrl: "https://example.test/i.jpg",
  createdAt: new Date().toISOString(),
} as PhotoDTO;
const slot = { x: 60, y: 120, rotate: -4, width: 120 };
const noop = () => undefined;

describe("SelectedPhoto", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("lifts a copy of the selected card with the accent ring and its category line", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WallSettingsContext.Provider value={DEFAULT_SETTINGS}>
          <SelectedPhoto selection={{ photo, slot }} handedOff={false} onLifted={noop} />
        </WallSettingsContext.Provider>,
      );
    });
    // The copy shows the selected photo (a small card decodes the thumbnail).
    const sources = renderer.root
      .findAllByType(Image)
      .map((node) => (node.props.source as { uri?: string } | undefined)?.uri);
    expect(sources).toContain(photo.thumbUrl);
    const views = renderer.root.findAllByType(View);
    expect(views.some((node) => node.props.testID === "wall-card-ring")).toBe(true);
    // Lifted, the card names the photo's category and the event hashtag under its caption.
    const text = renderer.root
      .findAllByType(Text)
      .map((node) => node.props.children)
      .flat(3)
      .filter((child): child is string => typeof child === "string");
    expect(text).toContain(DEFAULT_SETTINGS.eventHashtag);
  });

  it("starts the lifted copy on its slot's float, so the card never jumps when selected", () => {
    const offset = 3;
    const drift = new Animated.Value(1).interpolate({
      inputRange: [0, 1],
      outputRange: [0, offset],
    });
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WallSettingsContext.Provider value={DEFAULT_SETTINGS}>
          <SelectedPhoto selection={{ photo, slot, drift }} handedOff={false} onLifted={noop} />
        </WallSettingsContext.Provider>,
      );
    });
    // Before the lift runs, the copy sits exactly on the resting card: slot plus float.
    const layers = renderer.root
      .findAllByType(View)
      .filter((node) => node.props.pointerEvents === "none");
    const screenY = layers.reduce((y, node) => {
      const { transform = [] } = StyleSheet.flatten(node.props.style) as {
        transform?: { translateY?: number }[];
      };
      return y + transform.reduce((sum, step) => sum + (step.translateY ?? 0), 0);
    }, 0);
    expect(screenY).toBe(slot.y + offset);
  });

  it("draws the copy the same size and image as its wall card, and hands off once it lifts", () => {
    const onLifted = jest.fn();
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WallSettingsContext.Provider value={DEFAULT_SETTINGS}>
          <SelectedPhoto selection={{ photo, slot }} handedOff={false} onLifted={onLifted} />
        </WallSettingsContext.Provider>,
      );
    });
    // Same width as the wall card: the same source, so the decoded image is reused.
    const card = renderer.root.findAllByType(View).find((node) => {
      const flat = StyleSheet.flatten(node.props.style) as { width?: number } | undefined;
      return flat?.width === slot.width;
    });
    expect(card).toBeDefined();
    // The card's original hides only once the copy is drawn over it.
    expect(onLifted).not.toHaveBeenCalled();
    const [image] = renderer.root.findAllByType(Image);
    act(() => (image?.props.onLoad as () => void)());
    expect(onLifted).toHaveBeenCalledWith(photo.id);
  });

  it("draws nothing without a selection", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WallSettingsContext.Provider value={DEFAULT_SETTINGS}>
          <SelectedPhoto selection={null} handedOff={false} onLifted={noop} />
        </WallSettingsContext.Provider>,
      );
    });
    expect(renderer.toJSON()).toBeNull();
  });
});

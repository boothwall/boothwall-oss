import { THEME_COLORS } from "@boothwall/wall-ui/tokens";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { RemoteHintCard } from "./RemoteHintCard";

const colors = THEME_COLORS.conference;

function words(demo: boolean, paused: boolean) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <RemoteHintCard demo={demo} paused={paused} colors={colors} onClose={() => undefined} />,
    );
  });
  const text = tree.root
    .findAllByType(Text)
    .map((node) => [node.props.children].flat().filter((part) => typeof part === "string"))
    .flat();
  act(() => tree.unmount());
  return text;
}

it("names every button as it behaves in the mode and state, and what closes the card", () => {
  expect(words(false, false)).toEqual([
    "Remote",
    "OK",
    "Open a photo full screen",
    "hold",
    "OK",
    "Start or end a photo call",
    "Previous or next photo",
    "Pause the slideshow",
    "Show or hide this help",
    "Close a photo",
    " · twice to exit",
    "or",
    "closes",
  ]);
  expect(words(false, true)).toContain("Resume the slideshow");

  const demo = words(true, false);
  expect(demo).toContain("Themes");
  expect(demo).not.toContain("or");
});

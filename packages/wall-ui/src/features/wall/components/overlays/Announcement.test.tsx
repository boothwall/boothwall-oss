import { type WallLook } from "@boothwall/shared";
import React from "react";
import { AccessibilityInfo, Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { wallCopy } from "#features/wall/constants/copy";
import { WallLookContext } from "#features/wall/state/wallLookContext";

import { Announcement } from "./Announcement";

const LINE = "Demo wall · not affiliated with Amazon";

async function render(look: WallLook, reduced = false) {
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(reduced);
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <WallLookContext.Provider value={look}>
        <Announcement text={LINE} />
      </WallLookContext.Provider>,
    );
  });
  const has = (id: string) => renderer.root.findAllByProps({ testID: id }).length > 0;
  const shown = {
    texts: renderer.root.findAllByType(Text).map((node) => node.props.children),
    filled: has("wall-announcement-filled"),
    sheen: has("wall-sheen"),
    spoken: renderer.root.findAllByProps({ accessibilityLabel: wallCopy.announcementSpoken(LINE) })
      .length,
  };
  act(() => renderer.unmount());
  return shown;
}

describe("Announcement", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("keeps its labelled bar by default; filled, the megaphone stands in for the label", async () => {
    expect(await render({})).toMatchObject({ texts: [wallCopy.announcementLabel, LINE] });
    expect((await render({})).filled).toBe(false);
    const filled = await render({ announcement: "filled" });
    expect(filled).toMatchObject({ texts: [LINE], filled: true, sheen: true });
    expect(filled.spoken).toBeGreaterThan(0);
    expect(await render({ announcement: "filled" }, true)).toMatchObject({ sheen: false });
  });
});

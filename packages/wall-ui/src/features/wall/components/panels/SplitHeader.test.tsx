import { DEFAULT_SETTINGS, type EventPresentation } from "@boothwall/shared";
import React from "react";
import { type StyleProp, StyleSheet, Text, type TextStyle, View } from "react-native";
import TestRenderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";

import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";
import { fontSize } from "#foundation/tokens";

import { SplitHeader } from "./SplitHeader";

const NAME = "Ana & Marko's Summer Wedding";

function render(props: { presentation?: EventPresentation; ended?: boolean; total?: number }) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider
        value={{
          ...DEFAULT_SETTINGS,
          eventName: NAME,
          eventHashtag: "#AnaAndMarko",
          eventYear: "2026",
        }}
      >
        <SplitHeader
          presentation={props.presentation ?? { logoUrl: null, venue: "Villa Rosa" }}
          total={props.total ?? 39}
          status="live"
          ended={props.ended}
        />
      </WallSettingsContext.Provider>,
    );
  });
  return renderer;
}

const sizeOf = (node: ReactTestInstance) =>
  StyleSheet.flatten(node.props.style as StyleProp<TextStyle>).fontSize;
const layout = (node: ReactTestInstance, width: number) =>
  act(() =>
    (node.props.onLayout as (event: unknown) => void)({
      nativeEvent: { layout: { x: 0, y: 0, width, height: 30 } },
    }),
  );
const texts = (root: ReactTestInstance) =>
  root.findAllByType(Text).map((node) => node.props.children);

it("steps a long title down until it fits its column, the year with it", () => {
  const renderer = render({});
  const [column, measured] = renderer.root
    .findAllByType(View)
    .filter((node) => node.props.onLayout);
  const text = (children: string) =>
    renderer.root.findAllByType(Text).filter((node) => node.props.children === children);
  const title = () => text(NAME).find((node) => node.props.numberOfLines === 1)!;
  const year = () => text("2026")[0]!;
  expect(sizeOf(title())).toBe(fontSize.eventTitle);
  // The event column is 458 dp wide: 506 dp at 25 steps to 22 (445.3 wide; 23 would be 465.5).
  layout(column!, 458);
  layout(measured!, 506);
  expect([sizeOf(title()), sizeOf(year())]).toEqual([22, 22]);
  layout(measured!, 2000);
  expect(sizeOf(title())).toBe(fontSize.eventTitleMin);
  expect(title().props.numberOfLines).toBe(1);
  act(() => renderer.unmount());
});

it("shows the count and Live on the venue's row, and only the count once the event is over", () => {
  const live = render({});
  expect(texts(live.root)).toEqual(expect.arrayContaining(["Villa Rosa", "moments", "·", "Live"]));
  act(() => live.unmount());
  const over = render({ ended: true });
  expect(texts(over.root)).toEqual(expect.arrayContaining(["moments"]));
  expect(texts(over.root)).not.toEqual(expect.arrayContaining(["·"]));
  expect(over.root.findAllByProps({ testID: "status-pill" })).toHaveLength(0);
  act(() => over.unmount());
});

it("leaves the count out on an empty wall and keeps Live", () => {
  const empty = render({ total: 0 });
  expect(texts(empty.root)).not.toContain("moments");
  expect(texts(empty.root)).not.toContain("·");
  expect(empty.root.findAllByProps({ testID: "status-pill" }).length).toBeGreaterThan(0);
  act(() => empty.unmount());
});

it("centres the title in the band when there's no venue", () => {
  const renderer = render({ presentation: { logoUrl: null } });
  const [column] = renderer.root.findAllByType(View).filter((node) => node.props.onLayout);
  expect(StyleSheet.flatten(column!.props.style as StyleProp<TextStyle>)).toMatchObject({
    justifyContent: "center",
  });
  expect(texts(renderer.root)).not.toContain("Villa Rosa");
  act(() => renderer.unmount());
});

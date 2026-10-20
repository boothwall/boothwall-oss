import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { defaultWallCopy, WallCopyProvider } from "#copy";
import { wallCopy } from "#features/wall/constants/copy";
import { WallLookContext } from "#features/wall/state/wallLookContext";
import { WallSettingsContext } from "#features/wall/state/wallSettingsContext";

import { NowShowingBar } from "./NowShowingBar";

const photo = {
  id: "p1",
  caption: "Team photo!",
  tribe: "team",
  createdAt: new Date().toISOString(),
} as PhotoDTO;

function render(announcement: string, shown: PhotoDTO | null = photo, opensNext = false) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, announcement }}>
        <NowShowingBar
          photo={shown}
          position={2}
          total={6}
          durationMs={7000}
          cycleKey="c"
          paused={false}
          opensNext={opensNext}
        />
      </WallSettingsContext.Provider>,
    );
  });
  return renderer;
}

const texts = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map((node) => node.props.children);

describe("NowShowingBar", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("shows the photo on now, its counter, and swaps the caption for the hosts' announcement", () => {
    const plain = texts(render(""));
    expect(plain).toContain("Team photo!");
    expect(plain).toContain(wallCopy.counter(2, 6));

    const announced = texts(render("Keynote at 14:00"));
    expect(announced).toContain("Keynote at 14:00");
    expect(announced).not.toContain("Team photo!");
    expect(announced).toContain(wallCopy.counter(2, 6));
  });

  it("leaves the row to an announcement: no opens-next cue beside it", () => {
    expect(texts(render("", photo, true))).toContain(wallCopy.opensNext);
    expect(texts(render("Demo wall · not affiliated with Amazon", photo, true))).not.toContain(
      wallCopy.opensNext,
    );
  });

  it("still shows an announcement on an empty wall, and nothing without one", () => {
    expect(texts(render("Doors open at 9", null))).toEqual(["Announcement", "Doors open at 9"]);
    expect(render("", null).toJSON()).toBeNull();
  });

  it("uses a provided copy's counter and announcement label", () => {
    const wall = {
      ...defaultWallCopy.wall,
      counter: (current: number, total: number) => `${current} von ${total}`,
      announcementLabel: "Durchsage",
    };
    const shown = (announcement: string, current: PhotoDTO | null) => {
      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <WallCopyProvider copy={{ ...defaultWallCopy, wall }}>
            <WallSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, announcement }}>
              <NowShowingBar
                photo={current}
                position={2}
                total={6}
                durationMs={7000}
                cycleKey="c"
                paused={false}
              />
            </WallSettingsContext.Provider>
          </WallCopyProvider>,
        );
      });
      return texts(renderer);
    };
    expect(shown("", photo)).toContain("2 von 6");
    expect(shown("Doors open at 9", null)).toEqual(["Durchsage", "Doors open at 9"]);
  });

  it("leaves Live to the header in both looks", () => {
    const live = (header: "classic" | "split") => {
      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <WallLookContext.Provider value={{ header }}>
            <NowShowingBar
              photo={null}
              position={0}
              total={0}
              durationMs={7000}
              cycleKey="c"
              paused={false}
            />
          </WallLookContext.Provider>,
        );
      });
      const shown = renderer.root.findAllByProps({ testID: "status-pill" }).length > 0;
      act(() => renderer.unmount());
      return shown;
    };
    expect(live("classic")).toBe(false);
    expect(live("split")).toBe(false);
  });
});

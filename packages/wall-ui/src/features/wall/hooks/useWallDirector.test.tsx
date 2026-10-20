import { DEFAULT_SETTINGS, type PhotoDTO, type WallSettings } from "@boothwall/shared";
import React from "react";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { initialWallState, type WallState } from "../state/wallState";
import { useWallDirector } from "./useWallDirector";

const photos: PhotoDTO[] = ["a", "b", "c"].map((id) => ({
  id,
  status: "approved",
  caption: id,
  tribe: "guests",
  imageUrl: `https://api.test/photos/${id}/image`,
  thumbUrl: `https://api.test/photos/${id}/thumb`,
  createdAt: "2026-10-13T12:00:00.000Z",
}));

function mount(playbackPaused = false, uploadsOpen = true) {
  let wall: WallState = {
    ...initialWallState,
    pool: photos,
    slots: ["a", "b", "c"],
    settings: { ...DEFAULT_SETTINGS, playbackPaused, uploadsOpen },
  };
  let director!: ReturnType<typeof useWallDirector>;
  const renderedPauses: boolean[] = [];
  const pin = () => undefined;
  const turnPage = () => undefined;
  function Probe() {
    director = useWallDirector({ wall, pin, turnPage, selectEveryMs: 1000, autoOpen: false });
    renderedPauses.push(director.paused);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe />);
  });
  const update = (next: WallState) => {
    wall = next;
    act(() => renderer.update(<Probe />));
  };
  return {
    director: () => director,
    renderedPauses,
    settings: (patch: Partial<WallSettings>) =>
      update({ ...wall, settings: { ...wall.settings, ...patch } }),
    arrive: () => update({ ...wall, fresh: ["c"] }),
    unmount: () => act(() => renderer.unmount()),
  };
}

describe("useWallDirector persisted playback", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("starts paused on the first render and holds its selected photo", () => {
    const wall = mount(true);
    try {
      expect(wall.renderedPauses.every(Boolean)).toBe(true);
      expect(wall.director().selectedPhoto?.id).toBe("a");
      act(() => jest.advanceTimersByTime(3000));
      expect(wall.director().selectedPhoto?.id).toBe("a");
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      wall.unmount();
    }
  });

  it("reconciles paused reconnect snapshots and resumes for a persisted play update", () => {
    const wall = mount();
    try {
      act(() => jest.advanceTimersByTime(1000));
      expect(wall.director().selectedPhoto?.id).toBe("b");
      wall.settings({ playbackPaused: true });
      expect(wall.director().paused).toBe(true);
      act(() => jest.advanceTimersByTime(3000));
      expect(wall.director().selectedPhoto?.id).toBe("b");
      wall.settings({ playbackPaused: false });
      act(() => jest.advanceTimersByTime(1000));
      expect(wall.director().selectedPhoto?.id).toBe("c");
    } finally {
      wall.unmount();
    }
  });

  it("does not restart the countdown for duplicate desired state or intake changes", () => {
    const wall = mount();
    try {
      const cycle = wall.director().cycleKey;
      act(() => jest.advanceTimersByTime(600));
      wall.settings({ playbackPaused: false, uploadsOpen: false });
      expect(wall.director().cycleKey).toBe(cycle);
      act(() => jest.advanceTimersByTime(400));
      expect(wall.director().selectedPhoto?.id).toBe("b");
      wall.settings({ playbackPaused: true });
      const pausedCycle = wall.director().cycleKey;
      wall.settings({ playbackPaused: true, uploadsOpen: true });
      expect(wall.director().paused).toBe(true);
      expect(wall.director().cycleKey).toBe(pausedCycle);
    } finally {
      wall.unmount();
    }
  });

  it("keeps legacy playpause local until the next authoritative settings snapshot", () => {
    const wall = mount(true);
    try {
      act(() => wall.director().commands.playpause());
      expect(wall.director().paused).toBe(false);
      wall.arrive();
      expect(wall.director().paused).toBe(false);
      wall.settings({ playbackPaused: true });
      expect(wall.director().paused).toBe(true);
      act(() => wall.director().commands.playpause());
      act(() => wall.director().commands.playpause());
      expect(wall.director().paused).toBe(true);
      act(() => wall.director().commands.right());
      expect(wall.director().selectedPhoto?.id).toBe("b");
    } finally {
      wall.unmount();
    }
  });
});

describe("useWallDirector host playback", () => {
  it("lets the host's pause win over the wall's settings and follow its changes", () => {
    const wall: WallState = { ...initialWallState, pool: photos, slots: ["a", "b", "c"] };
    let director!: ReturnType<typeof useWallDirector>;
    const noop = () => undefined;
    function Probe({ paused }: { paused?: boolean }) {
      director = useWallDirector({
        wall,
        pin: noop,
        turnPage: noop,
        selectEveryMs: 1000,
        autoOpen: false,
        paused,
      });
      return null;
    }
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Probe paused />);
    });
    expect(director.paused).toBe(true);
    act(() => renderer.update(<Probe paused={false} />));
    expect(director.paused).toBe(false);
    act(() => renderer.unmount());
  });
});

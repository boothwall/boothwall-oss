import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";

import {
  atPageEnd,
  type DirectorEvent,
  type DirectorState,
  initialDirectorState,
  pinnedIds,
  wallDirector,
} from "./wallDirector";
import { initialWallState, SLOT_COUNT, wallReducer, type WallState } from "./wallState";
import { planStep } from "./wallStep";

const photo = (n: number): PhotoDTO => ({
  id: `p${n}`,
  status: "approved",
  caption: null,
  tribe: "fire-tv",
  imageUrl: `https://api.test/photos/p${n}/image`,
  thumbUrl: `https://api.test/photos/p${n}/thumb`,
  createdAt: new Date(Date.UTC(2026, 9, 7, 12, 0, n)).toISOString(),
});
const stats = { total: 0, byTribe: {} };

/**
 * Drives both reducers and `planStep` the way useWallDirector does. `commit()` stands for React
 * rendering: until then the hook's wall ref only knows about page turns it made itself.
 */
function wallOf(count: number) {
  const photos = Array.from({ length: count }, (_, i) => photo(count - i)); // newest first
  let wall: WallState = wallReducer(initialWallState, {
    type: "snapshot",
    snapshot: { photos, stats, settings: DEFAULT_SETTINGS },
  });
  let director: DirectorState = initialDirectorState;
  let committed = wall;

  const send = (event: DirectorEvent) => {
    director = wallDirector(director, event);
    wall = wallReducer(wall, { type: "pin", ids: pinnedIds(director) });
  };
  const commit = () => {
    const slot = director.selectedId === null ? -1 : wall.slots.indexOf(director.selectedId);
    if (slot === -1) send({ type: "selectionEmptied", slots: wall.slots, slot: 0 });
    committed = wall;
  };
  commit();

  // What useWallDirector does with a step: turn the page if planned, then tell the director.
  const step = (direction: 1 | -1, auto: boolean) => {
    const { page, event } = planStep(committed, director, direction, auto);
    if (page) {
      wall = wallReducer(wall, { type: "page", slots: page });
      committed = { ...committed, slots: page };
    }
    send(event);
  };

  return {
    selected: () => director.selectedId,
    slots: () => wall.slots,
    onScreen: () => director.selectedId !== null && wall.slots.includes(director.selectedId),
    commit,
    press: (direction: 1 | -1) => step(direction, false),
    advance: () => step(1, true),
    arrive(n: number) {
      wall = wallReducer(wall, {
        type: "event",
        event: { type: "photo.created", photo: photo(n), stats },
      });
      commit();
      send({ type: "arrival", photoId: `p${n}` });
    },
  };
}

const ids = (from: number, to: number) =>
  Array.from({ length: from - to + 1 }, (_, i) => `p${from - i}`);

describe("stepping through the wall", () => {
  it("walks the page card by card, then turns to the next page", () => {
    const wall = wallOf(SLOT_COUNT + 5);
    const seen = [wall.selected()];
    for (let i = 0; i < SLOT_COUNT + 2; i++) {
      wall.advance();
      wall.commit();
      seen.push(wall.selected());
      expect(wall.onScreen()).toBe(true);
    }
    // p16..p6 on the first page, then the next page starts with p5.
    expect(seen.slice(0, SLOT_COUNT)).toEqual(ids(SLOT_COUNT + 5, 6));
    expect(seen[SLOT_COUNT]).toBe("p5");
    expect(wall.slots()[0]).toBe("p5");
  });

  it("goes back a page from the first card and lands on its last card", () => {
    const wall = wallOf(SLOT_COUNT * 2);
    wall.press(-1);
    wall.commit();
    // The page before the newest wraps round to the oldest photos; p1 is its last card.
    expect(wall.selected()).toBe("p1");
    wall.press(1);
    wall.commit();
    expect(wall.selected()).toBe(`p${SLOT_COUNT * 2}`);
  });

  it("counts every press, even several before React renders", () => {
    const wall = wallOf(SLOT_COUNT + 2);
    for (let i = 0; i < SLOT_COUNT + 1; i++) wall.press(1);
    wall.commit();
    // Past the end of the first page and one card into the next.
    expect(wall.slots()[1]).toBe(wall.selected());
    expect(wall.onScreen()).toBe(true);
  });

  it("wraps round the same page when every photo fits on screen", () => {
    const wall = wallOf(3);
    for (let i = 0; i < 3; i++) wall.press(1);
    wall.commit();
    expect(wall.selected()).toBe("p3");
  });

  it("lets a queued arrival take its turn before the page turns", () => {
    const wall = wallOf(SLOT_COUNT + 4);
    for (let i = 0; i < SLOT_COUNT - 1; i++) wall.advance();
    wall.commit();
    expect(atPageEnd(wall.slots(), wall.selected(), 1)).toBe(true);

    wall.arrive(100);
    wall.advance();
    wall.commit();
    expect(wall.selected()).toBe("p100");
    expect(wall.onScreen()).toBe(true);
  });
});

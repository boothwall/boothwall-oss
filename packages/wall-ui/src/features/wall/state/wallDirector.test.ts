import {
  atPageEnd,
  type DirectorState,
  initialDirectorState,
  opensNext,
  pinnedIds,
  type Slots,
  wallDirector,
} from "./wallDirector";

const slots: Slots = ["a", null, "b", "c"];
const BEAT = 4;
const state = (patch: Partial<DirectorState> = {}): DirectorState => ({
  ...initialDirectorState,
  ...patch,
});

describe("wallDirector", () => {
  it("advances to the next filled slot and wraps around, skipping empty ones", () => {
    const first = wallDirector(state({ selectedId: "a" }), {
      type: "advance",
      slots,
      openEvery: BEAT,
    });
    expect(first).toMatchObject({ selectedId: "b", cycle: 1 });

    const wrapped = wallDirector(state({ selectedId: "c" }), {
      type: "advance",
      slots,
      openEvery: BEAT,
    });
    expect(wrapped.selectedId).toBe("a");

    const back = wallDirector(state({ selectedId: "a" }), {
      type: "move",
      direction: -1,
      slots,
    });
    expect(back).toMatchObject({ selectedId: "c", cycle: 1 });
  });

  it("queues an arrival, then selects it and opens the spotlight in auto mode", () => {
    const queued = wallDirector(state({ selectedId: "a" }), { type: "arrival", photoId: "c" });
    expect(queued).toMatchObject({ nextUp: "c", selectedId: "a", spotlight: false });
    expect(pinnedIds(queued)).toEqual(["a", "c"]);

    const shown = wallDirector(queued, { type: "advance", slots, openEvery: BEAT });
    expect(shown).toMatchObject({
      nextUp: null,
      selectedId: "c",
      cycle: 1,
      spotlight: true,
      autoSpotlight: true,
    });

    const after = wallDirector(shown, { type: "advance", slots, openEvery: BEAT });
    expect(after).toMatchObject({ selectedId: "a", spotlight: false, autoSpotlight: false });
  });

  it("keeps a spotlight the viewer opened when an arrival takes its turn", () => {
    const open = state({ spotlight: true, nextUp: "b" });
    const next = wallDirector(open, { type: "advance", slots, openEvery: BEAT });
    expect(next).toMatchObject({ selectedId: "b", spotlight: true, autoSpotlight: false });

    // A slideshow the viewer opened keeps going.
    expect(wallDirector(next, { type: "advance", slots, openEvery: BEAT }).spotlight).toBe(true);
  });

  it("opens every fourth timed step full screen, for one step: lift, lift, lift, open", () => {
    const beat: string[] = [];
    let current = state({ selectedId: "a" });
    for (let i = 0; i < 8; i++) {
      expect(opensNext(current, BEAT)).toBe(i % BEAT === BEAT - 1);
      current = wallDirector(current, { type: "advance", slots, openEvery: BEAT });
      beat.push(current.spotlight ? "open" : "lift");
    }
    expect(beat).toEqual(["lift", "lift", "lift", "open", "lift", "lift", "lift", "open"]);
    expect(current).toMatchObject({ autoSpotlight: true, stepsSinceOpen: 0 });
  });

  it("counts a page turned by the timer as a step, but not one turned by the remote", () => {
    const pageSlots = ["x", "y"];
    const third = state({ selectedId: "c", stepsSinceOpen: 3 });
    const timed = wallDirector(third, {
      type: "pageTurned",
      direction: 1,
      slots: pageSlots,
      openEvery: BEAT,
    });
    expect(timed).toMatchObject({ selectedId: "x", spotlight: true, stepsSinceOpen: 0 });
    const remote = wallDirector(third, { type: "pageTurned", direction: 1, slots: pageSlots });
    expect(remote).toMatchObject({ selectedId: "x", spotlight: false, stepsSinceOpen: 3 });
  });

  it("opens a new photo as the next step whatever the count, and starts the count again", () => {
    const queued = state({ selectedId: "a", stepsSinceOpen: 1, nextUp: "c" });
    expect(opensNext(queued, BEAT)).toBe(true);
    const shown = wallDirector(queued, { type: "advance", slots, openEvery: BEAT });
    expect(shown).toMatchObject({ selectedId: "c", spotlight: true, stepsSinceOpen: 0 });

    const beat: boolean[] = [];
    let current = shown;
    for (let i = 0; i < BEAT; i++) {
      current = wallDirector(current, { type: "advance", slots, openEvery: BEAT });
      beat.push(current.spotlight);
    }
    expect(beat).toEqual([false, false, false, true]);
  });

  it("with auto-open off never opens on the beat, but still opens a new photo", () => {
    const off = Number.POSITIVE_INFINITY;
    let current = wallDirector(state({ selectedId: "a" }), {
      type: "advance",
      slots,
      openEvery: off,
    });
    for (let i = 0; i < 8; i++) {
      current = wallDirector(current, { type: "advance", slots, openEvery: off });
      expect(current.spotlight).toBe(false);
    }
    const arrived = wallDirector(current, { type: "arrival", photoId: "b" });
    expect(opensNext(arrived, off)).toBe(true);
    expect(wallDirector(arrived, { type: "advance", slots, openEvery: off }).spotlight).toBe(true);
  });

  it("leaves the remote in charge: manual open, close, pause and moves keep working", () => {
    const onBeat = wallDirector(state({ selectedId: "a", stepsSinceOpen: 3 }), {
      type: "advance",
      slots,
      openEvery: BEAT,
    });
    expect(onBeat).toMatchObject({ spotlight: true, autoSpotlight: true });
    // OK takes the wall's spotlight over; Back closes it.
    const viewerOwned = wallDirector(onBeat, { type: "toggleSpotlight" });
    expect(viewerOwned).toMatchObject({ spotlight: false, autoSpotlight: false });
    expect(wallDirector(onBeat, { type: "closeSpotlight" })).toMatchObject({
      spotlight: false,
      autoSpotlight: false,
    });
    const opened = wallDirector(state({ selectedId: "a" }), { type: "toggleSpotlight" });
    expect(opened).toMatchObject({ spotlight: true, autoSpotlight: false });
    // Remote moves don't count towards the beat.
    const moved = wallDirector(state({ selectedId: "a", stepsSinceOpen: 3 }), {
      type: "move",
      direction: 1,
      slots,
    });
    expect(moved).toMatchObject({ selectedId: "b", spotlight: false, stepsSinceOpen: 3 });
    const paused = wallDirector(state(), { type: "togglePause" });
    expect(paused.paused).toBe(true);
  });

  it("follows the selected photo by id, wherever its slot goes", () => {
    // Shuffled slots: advancing still starts from the selected photo.
    const picked = state({ selectedId: "c" });
    expect(
      wallDirector(picked, {
        type: "advance",
        slots: ["c", "a", null, "b"],
        openEvery: BEAT,
      }).selectedId,
    ).toBe("a");
  });

  it("starts a new page from its first card, or its last when going back", () => {
    const slots = [null, "x", "y", "z", null];
    const forward = wallDirector(state({ selectedId: "c", autoSpotlight: true, spotlight: true }), {
      type: "pageTurned",
      direction: 1,
      slots,
    });
    expect(forward).toMatchObject({ selectedId: "x", spotlight: false, autoSpotlight: false });
    expect(
      wallDirector(state({ selectedId: "c" }), { type: "pageTurned", direction: -1, slots })
        .selectedId,
    ).toBe("z");
  });

  it("knows when the selection is the last card on the page", () => {
    const slots = [null, "a", "b", null];
    expect(atPageEnd(slots, "b", 1)).toBe(true);
    expect(atPageEnd(slots, "a", 1)).toBe(false);
    expect(atPageEnd(slots, "a", -1)).toBe(true);
    expect(atPageEnd(slots, null, 1)).toBe(false);
  });

  it("hands over to the photo that took the selection's slot, and stays put on an empty wall", () => {
    const replaced = wallDirector(state({ selectedId: "gone" }), {
      type: "selectionEmptied",
      slots,
      slot: 2,
    });
    expect(replaced).toMatchObject({ selectedId: "b", cycle: 1 });

    const next = wallDirector(state({ selectedId: "gone" }), {
      type: "selectionEmptied",
      slots,
      slot: 1,
    });
    expect(next.selectedId).toBe("b");

    const still = state({ selectedId: "a" });
    expect(wallDirector(still, { type: "selectionEmptied", slots, slot: 0 })).toBe(still);

    const empty = state();
    expect(wallDirector(empty, { type: "advance", slots: [null, null], openEvery: BEAT })).toEqual(
      empty,
    );
  });
});

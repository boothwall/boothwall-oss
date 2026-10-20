export type Slots = readonly (string | null)[];

export type DirectorState = {
  /**
   * The selected photo. Kept by id, not slot: whatever happens to the slots, the remote and the
   * countdown carry on from the photo the viewer is looking at.
   */
  selectedId: string | null;
  /** Bumped whenever the current photo's countdown restarts. */
  cycle: number;
  paused: boolean;
  spotlight: boolean;
  /** The spotlight was opened by the wall itself and closes after one cycle. */
  autoSpotlight: boolean;
  /** A live arrival waiting for the current photo to finish. */
  nextUp: string | null;
  /** Timed steps since the wall last opened a photo full screen; every nth one opens. */
  stepsSinceOpen: number;
};

export type DirectorEvent =
  /**
   * The timer's step. `openEvery` is how many steps make one beat (the last one opens full
   * screen): Infinity with auto-open off, so only new photos open; 0 opens nothing.
   */
  | { type: "advance"; slots: Slots; openEvery: number }
  | { type: "arrival"; photoId: string }
  | { type: "move"; direction: 1 | -1; slots: Slots }
  /** The wall turned to a new page: start from its first card (or its last, going back). */
  /** `openEvery` is set when the timer turned the page (see `advance`), absent for the remote. */
  | { type: "pageTurned"; direction: 1 | -1; slots: Slots; openEvery?: number }
  | { type: "toggleSpotlight" }
  | { type: "closeSpotlight" }
  | { type: "togglePause" }
  | { type: "setPaused"; paused: boolean }
  /** The selected photo left the wall (or nothing is selected yet); `slot` is where it was. */
  | { type: "selectionEmptied"; slots: Slots; slot: number };

export const initialDirectorState: DirectorState = {
  selectedId: null,
  cycle: 0,
  paused: false,
  spotlight: false,
  autoSpotlight: false,
  nextUp: null,
  stepsSinceOpen: 0,
};

export const filledSlotsOf = (slots: Slots) => slots.flatMap((id, index) => (id ? [index] : []));

/** The photos the wall must keep in place: the selection and a queued arrival. */
export const pinnedIds = (state: DirectorState) =>
  [state.selectedId, state.nextUp].filter((id): id is string => id !== null);

/**
 * True when the timer's next step opens a photo full screen: a queued arrival always does, and
 * otherwise every `openEvery`th step. Lets the footer show the beat before it lands.
 */
export const opensNext = (state: DirectorState, openEvery: number) =>
  openEvery > 0 && (state.nextUp !== null || state.stepsSinceOpen + 1 >= openEvery);

/**
 * One timed step has selected its card: count it, and on the beat (or for an arrival) open the
 * selection full screen. A spotlight the viewer opened stays theirs.
 */
function countStep(state: DirectorState, openEvery: number, arrival = false): DirectorState {
  const steps = arrival ? openEvery : state.stepsSinceOpen + 1;
  if (openEvery <= 0 || steps < openEvery) return { ...state, stepsSinceOpen: steps };
  if (state.spotlight) return { ...state, stepsSinceOpen: 0 };
  return { ...state, spotlight: true, autoSpotlight: true, stepsSinceOpen: 0 };
}

/**
 * True when the selection is the last card on the page going `direction`: one more step turns
 * the page instead of wrapping round to the other end. Slots are numbered in reading order.
 */
export function atPageEnd(slots: Slots, selectedId: string | null, direction: 1 | -1): boolean {
  const filled = filledSlotsOf(slots);
  const edge = direction === 1 ? filled[filled.length - 1] : filled[0];
  return selectedId !== null && edge !== undefined && slots[edge] === selectedId;
}

/** Selects the photo in the first filled slot from `from`, stepping by `direction`. */
function selectFrom(
  state: DirectorState,
  from: number,
  direction: 1 | -1,
  slots: Slots,
): DirectorState {
  const count = slots.length;
  for (let step = 0; step < count; step++) {
    const id = slots[(((from + step * direction) % count) + count) % count];
    if (id) return { ...state, selectedId: id, cycle: state.cycle + 1 };
  }
  return state;
}

function move(state: DirectorState, direction: 1 | -1, slots: Slots): DirectorState {
  const current = state.selectedId === null ? -1 : slots.indexOf(state.selectedId);
  const from = current === -1 ? 0 : current + direction;
  return selectFrom(state, from, direction, slots);
}

export function wallDirector(state: DirectorState, event: DirectorEvent): DirectorState {
  switch (event.type) {
    case "advance": {
      const queued = state.nextUp !== null && event.slots.includes(state.nextUp);
      // A spotlight the wall opened itself lasts one step.
      const next = state.autoSpotlight
        ? { ...state, nextUp: null, spotlight: false, autoSpotlight: false }
        : { ...state, nextUp: null };
      if (queued) {
        // Show the arrival; it opens full screen as this step, whatever the count.
        const shown = { ...next, selectedId: state.nextUp, cycle: state.cycle + 1 };
        return countStep(shown, event.openEvery, true);
      }
      const moved = move(next, 1, event.slots);
      return moved === next ? moved : countStep(moved, event.openEvery);
    }

    case "arrival":
      return { ...state, nextUp: event.photoId };

    case "move":
      return move(state, event.direction, event.slots);

    case "pageTurned": {
      // Like an advance: a spotlight the wall opened itself closes with the old page.
      const next = state.autoSpotlight
        ? { ...state, spotlight: false, autoSpotlight: false }
        : state;
      const from = event.direction === 1 ? 0 : event.slots.length - 1;
      const turned = selectFrom(next, from, event.direction, event.slots);
      return event.openEvery === undefined || turned === next
        ? turned
        : countStep(turned, event.openEvery);
    }

    case "toggleSpotlight":
      return { ...state, spotlight: !state.spotlight, autoSpotlight: false };

    case "closeSpotlight":
      if (!state.spotlight && !state.autoSpotlight) return state;
      return { ...state, spotlight: false, autoSpotlight: false };

    case "togglePause":
      return { ...state, paused: !state.paused, cycle: state.cycle + 1 };

    case "setPaused":
      return state.paused === event.paused
        ? state
        : { ...state, paused: event.paused, cycle: state.cycle + 1 };

    case "selectionEmptied":
      if (state.selectedId !== null && event.slots.includes(state.selectedId)) return state;
      // Whatever took its place, else the next photo along.
      return selectFrom(state, event.slot, 1, event.slots);
  }
}

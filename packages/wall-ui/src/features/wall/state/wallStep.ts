import { atPageEnd, type DirectorEvent, type DirectorState } from "./wallDirector";
import { nextPage } from "./wallPages";
import type { WallState } from "./wallState";

export type WallStep = {
  /** The new page's slots when this step turns the page; null otherwise. */
  page: (string | null)[] | null;
  event: DirectorEvent;
};

/**
 * One step along the wall, by the timer (`auto`) or the remote: the next card in reading order,
 * or at the end of the page the next page. A queued live arrival takes the timer's turn first.
 */
export function planStep(
  wall: WallState,
  director: DirectorState,
  direction: 1 | -1,
  auto: boolean,
  /** See the `advance` event: Infinity opens only new photos, 0 (the default) opens nothing. */
  openEvery = 0,
): WallStep {
  const { nextUp, selectedId } = director;
  const arrivalWaiting = auto && nextUp !== null && wall.slots.includes(nextUp);
  if (!arrivalWaiting && atPageEnd(wall.slots, selectedId, direction)) {
    const slots = nextPage(wall, direction);
    if (slots !== wall.slots) {
      return {
        page: slots,
        event: auto
          ? { type: "pageTurned", direction, slots, openEvery }
          : { type: "pageTurned", direction, slots },
      };
    }
  }
  return {
    page: null,
    event: auto
      ? { type: "advance", slots: wall.slots, openEvery }
      : { type: "move", direction, slots: wall.slots },
  };
}

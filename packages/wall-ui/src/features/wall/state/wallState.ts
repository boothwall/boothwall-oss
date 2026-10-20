import {
  DEFAULT_SETTINGS,
  type PhotoDTO,
  type ReactionCounts,
  type WallPhotoEvent,
  type WallSettings,
  type WallSnapshotDTO,
  type WallStatsDTO,
} from "@boothwall/shared";

import { POOL_LIMIT } from "../constants/feed";
import { SLOT_COUNT } from "../constants/layout";

export { SLOT_COUNT };

export type WallState = {
  /** Approved photos, newest first. */
  pool: PhotoDTO[];
  /** Photo id per on-screen slot. */
  slots: (string | null)[];
  stats: WallStatsDTO;
  /** Ids that arrived live and should get the "new" treatment. */
  fresh: string[];
  /**
   * Photos the director needs to stay where they are (the selection and a queued arrival):
   * arrivals never land in their slots.
   */
  pinned: string[];
  /** Bumped on every page turn, so the collage can swap the cards in a wave. */
  turn: number;
  /** Live settings from the Control panel (or the config defaults). */
  settings: WallSettings;
};

export type WallAction =
  | { type: "snapshot"; snapshot: WallSnapshotDTO }
  | { type: "event"; event: WallPhotoEvent }
  /** Replace every card with the next page (see `nextPage`). */
  | { type: "page"; slots: (string | null)[] }
  | { type: "pin"; ids: string[] }
  | { type: "settings"; settings: WallSettings }
  /** A photo's latest reaction totals. */
  | { type: "reactions"; photoId: string; counts: ReactionCounts }
  | { type: "settled"; photoId: string };

export const initialWallState: WallState = {
  pool: [],
  slots: Array<string | null>(SLOT_COUNT).fill(null),
  stats: { total: 0, byTribe: {} },
  fresh: [],
  pinned: [],
  turn: 0,
  settings: DEFAULT_SETTINGS,
};

const createdAt = (pool: PhotoDTO[], id: string | null) =>
  pool.find((photo) => photo.id === id)?.createdAt ?? "";

/** The slot showing the oldest photo `spare` doesn't rule out, if any. */
const oldestSlot = (state: WallState, spare: (id: string) => boolean) =>
  state.slots
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => id !== null && !spare(id))
    .reduce<{ id: string | null; index: number } | undefined>(
      (best, slot) =>
        !best || createdAt(state.pool, slot.id) < createdAt(state.pool, best.id) ? slot : best,
      undefined,
    )?.index;

/** Best slot for an incoming photo: an empty one, else the one showing the oldest unpinned photo. */
const slotFor = (state: WallState) => {
  const empty = state.slots.indexOf(null);
  if (empty !== -1) return empty;
  return (
    oldestSlot(state, (id) => state.pinned.includes(id)) ?? oldestSlot(state, () => false) ?? 0
  );
};

const offscreen = (state: WallState) =>
  state.pool.filter((photo) => !state.slots.includes(photo.id));

const place = (slots: (string | null)[], index: number, id: string | null) =>
  slots.map((current, i) => (i === index ? id : current));

/**
 * Keeps an 8-hour booth from drifting: a slot whose photo fell out of the capped pool gets a
 * waiting one, and only photos still on screen keep the "new" treatment (a card replaced before
 * its badge settled would otherwise stay in `fresh` forever).
 */
function tidy(state: WallState): WallState {
  const inPool = new Set(state.pool.map((photo) => photo.id));
  let { slots } = state;
  if (slots.some((id) => id !== null && !inPool.has(id))) {
    const kept = slots.map((id) => (id !== null && inPool.has(id) ? id : null));
    const queue = state.pool.filter((photo) => !kept.includes(photo.id));
    slots = kept.map(
      (id, i) => id ?? (state.slots[i] === null ? null : (queue.shift()?.id ?? null)),
    );
  }
  const fresh = state.fresh.filter((id) => slots.includes(id));
  if (slots === state.slots && fresh.length === state.fresh.length) return state;
  return { ...state, slots, fresh };
}

export function wallReducer(state: WallState, action: WallAction): WallState {
  switch (action.type) {
    case "snapshot": {
      const pool = action.snapshot.photos.slice(0, POOL_LIMIT);
      // Keep photos that are still approved where they are; fill gaps with the newest.
      const kept = state.slots.map((id) => (pool.some((photo) => photo.id === id) ? id : null));
      const queue = pool.filter((photo) => !kept.includes(photo.id));
      const slots = kept.map((id) => id ?? queue.shift()?.id ?? null);
      const { stats, settings } = action.snapshot;
      return tidy({ ...state, pool, slots, stats, settings });
    }

    case "event": {
      const { event } = action;
      if (event.type === "photo.created") {
        if (state.pool.some((photo) => photo.id === event.photo.id)) return state;
        const pool = [event.photo, ...state.pool].slice(0, POOL_LIMIT);
        const slots = place(state.slots, slotFor(state), event.photo.id);
        const fresh = [...state.fresh, event.photo.id];
        return tidy({ ...state, pool, slots, stats: event.stats, fresh });
      }
      if (event.type === "photo.updated") {
        // New caption or category, same photo: it stays in its slot and keeps its place.
        const pool = state.pool.map((photo) => (photo.id === event.photo.id ? event.photo : photo));
        return { ...state, pool, stats: event.stats };
      }
      const pool = state.pool.filter((photo) => photo.id !== event.photoId);
      const index = state.slots.indexOf(event.photoId);
      const next = {
        ...state,
        pool,
        stats: event.stats,
        fresh: state.fresh.filter((id) => id !== event.photoId),
      };
      if (index === -1) return next;
      return { ...next, slots: place(state.slots, index, offscreen(next)[0]?.id ?? null) };
    }

    case "page":
      return tidy({ ...state, slots: action.slots, turn: state.turn + 1 });

    case "pin":
      return { ...state, pinned: action.ids };

    case "settings":
      return { ...state, settings: action.settings };

    case "reactions": {
      if (!state.pool.some((photo) => photo.id === action.photoId)) return state;
      const pool = state.pool.map((photo) =>
        photo.id === action.photoId ? { ...photo, reactions: action.counts } : photo,
      );
      return { ...state, pool };
    }

    case "settled":
      return { ...state, fresh: state.fresh.filter((id) => id !== action.photoId) };
  }
}

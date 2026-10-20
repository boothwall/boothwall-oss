import type { PhotoDTO } from "@boothwall/shared";

import {
  FINALE_MS,
  FINALE_PHOTOS,
  PHOTO_CALL_MS,
} from "#features/photo-call/constants/photoCall.constants";

export interface Finale {
  until: number;
  /** The newest photos that reached the wall during the call. */
  photos: readonly PhotoDTO[];
  count: number;
}

export interface PhotoCall {
  endsAt: number;
  /** Which call this is, from 0; it picks the mission. */
  index: number;
  /** The photos already on the wall when the call started. */
  before: ReadonlySet<string>;
  finale: Finale | null;
}

export interface PhotoCallState {
  call: PhotoCall | null;
  started: number;
}

export type PhotoCallAction =
  | { type: "toggle" | "start" | "finish"; now: number; photos: readonly PhotoDTO[] }
  | { type: "close" };

export const initialPhotoCall: PhotoCallState = { call: null, started: 0 };

/** Photos on the wall now that weren't when the call started, newest first. */
export const arrivals = (call: PhotoCall, photos: readonly PhotoDTO[]) =>
  photos.filter((photo) => !call.before.has(photo.id));

const opened = (state: PhotoCallState, now: number, photos: readonly PhotoDTO[]) => ({
  started: state.started + 1,
  call: {
    endsAt: now + PHOTO_CALL_MS,
    index: state.started,
    before: new Set(photos.map((photo) => photo.id)),
    finale: null,
  },
});

export function photoCallReducer(state: PhotoCallState, action: PhotoCallAction): PhotoCallState {
  const { call } = state;
  switch (action.type) {
    case "toggle":
      return call ? { ...state, call: null } : opened(state, action.now, action.photos);
    case "start":
      return call ? state : opened(state, action.now, action.photos);
    case "finish": {
      if (!call || call.finale) return state;
      const landed = arrivals(call, action.photos);
      const finale = {
        until: action.now + FINALE_MS,
        photos: landed.slice(0, FINALE_PHOTOS),
        count: landed.length,
      };
      return { ...state, call: { ...call, finale } };
    }
    case "close":
      return call ? { ...state, call: null } : state;
  }
}

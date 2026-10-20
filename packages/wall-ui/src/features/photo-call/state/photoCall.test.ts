import type { PhotoDTO } from "@boothwall/shared";

import {
  FINALE_MS,
  FINALE_PHOTOS,
  PHOTO_CALL_MS,
} from "#features/photo-call/constants/photoCall.constants";

import { arrivals, initialPhotoCall, photoCallReducer } from "./photoCall";

const photos = (...ids: string[]) => ids.map((id) => ({ id }) as PhotoDTO);

describe("photoCallReducer", () => {
  it("opens a numbered call that remembers the photos already on the wall", () => {
    const { call } = photoCallReducer(initialPhotoCall, {
      type: "toggle",
      now: 1000,
      photos: photos("a", "b"),
    });
    expect(call?.endsAt).toBe(1000 + PHOTO_CALL_MS);
    expect(call?.index).toBe(0);
    expect(call && arrivals(call, photos("c", "a", "b"))).toEqual(photos("c"));
  });

  it("finishes into a finale with the newest arrivals, once", () => {
    const open = photoCallReducer(initialPhotoCall, {
      type: "toggle",
      now: 0,
      photos: photos("a"),
    });
    const landed = photos("g", "f", "e", "d", "c", "b", "a");
    const finished = photoCallReducer(open, { type: "finish", now: 5000, photos: landed });
    expect(finished.call?.finale).toEqual({
      until: 5000 + FINALE_MS,
      photos: landed.slice(0, FINALE_PHOTOS),
      count: 6,
    });
    expect(photoCallReducer(finished, { type: "finish", now: 9000, photos: landed })).toBe(
      finished,
    );
  });

  it("closes from a call or its finale, and numbers the next call", () => {
    const open = photoCallReducer(initialPhotoCall, { type: "toggle", now: 0, photos: [] });
    const closed = photoCallReducer(open, { type: "close" });
    expect(closed.call).toBeNull();
    expect(photoCallReducer(closed, { type: "close" })).toBe(closed);
    const next = photoCallReducer(closed, { type: "toggle", now: 0, photos: [] });
    expect(next.call?.index).toBe(1);
    expect(photoCallReducer(next, { type: "toggle", now: 1, photos: [] }).call).toBeNull();
  });

  it("starts from the host's phone without ever closing a running call", () => {
    const started = photoCallReducer(initialPhotoCall, { type: "start", now: 0, photos: [] });
    expect(started.call?.index).toBe(0);
    expect(photoCallReducer(started, { type: "start", now: 5, photos: [] })).toBe(started);
  });
});

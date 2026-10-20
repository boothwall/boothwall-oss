import type { PhotoDTO } from "@boothwall/shared";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { arrivals, initialPhotoCall, photoCallReducer } from "#features/photo-call/state/photoCall";

/**
 * A host's photo call over the wall's photos: open or close it, finish it into its closing card.
 * The host binds its own keys to these (the TV remote's Back, the keyboard's Escape).
 */
export function usePhotoCallState(photos: readonly PhotoDTO[]) {
  const [{ call }, dispatch] = useReducer(photoCallReducer, initialPhotoCall);
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);

  const toggle = useCallback(
    () => dispatch({ type: "toggle", now: Date.now(), photos: latest.current }),
    [],
  );
  const start = useCallback(
    () => dispatch({ type: "start", now: Date.now(), photos: latest.current }),
    [],
  );
  const finish = useCallback(
    () => dispatch({ type: "finish", now: Date.now(), photos: latest.current }),
    [],
  );
  const close = useCallback(() => dispatch({ type: "close" }), []);

  return {
    call,
    newPhotos: call ? arrivals(call, photos).length : 0,
    toggle,
    start,
    finish,
    close,
  };
}

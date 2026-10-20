import type { PhotoDTO } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { HURRY_MS, OPEN_EVERY_STEPS, SELECT_DEBOUNCE_MS } from "../constants/timing";
import { prefetchImage } from "../data/prefetchImage";
import {
  atPageEnd,
  type DirectorEvent,
  filledSlotsOf,
  initialDirectorState,
  opensNext,
  pinnedIds,
  wallDirector,
} from "../state/wallDirector";
import { nextPage, pageCount, pageOf } from "../state/wallPages";
import { planStep } from "../state/wallStep";
import type { RemoteCommands, WallDirectorOptions } from "./wall-director.types";

export type { RemoteCommands } from "./wall-director.types";

const ignore = () => undefined;
export const STILL_REMOTE: RemoteCommands = {
  left: ignore,
  right: ignore,
  select: ignore,
  back: ignore,
  playpause: ignore,
};

/**
 * Owns the wall's timers and feeds them into the `wallDirector` reducer. The selection walks the
 * cards in reading order, one at a time; after the last card the whole page turns to the next
 * photos, so viewers always know where the wall goes next.
 */
export function useWallDirector({
  wall,
  turnPage,
  pin,
  selectEveryMs,
  autoOpen,
  held = false,
  paused: hostPaused,
}: WallDirectorOptions) {
  const [state, dispatch] = useReducer(wallDirector, {
    ...initialDirectorState,
    paused: hostPaused ?? wall.settings.playbackPaused,
  });
  const { selectedId, cycle, paused, spotlight, autoSpotlight, nextUp } = state;
  const hurry = nextUp !== null;
  // With auto-open off the beat never comes round, but a guest's new photo still opens: seeing it
  // land is the moment the wall is for.
  const openEvery = autoOpen ? OPEN_EVERY_STEPS : Number.POSITIVE_INFINITY;

  // Timers and remote commands read the latest wall without restarting.
  const wallRef = useRef(wall);
  useEffect(() => {
    wallRef.current = wall;
  }, [wall]);

  // The director's state as of the last event, not the last render: a second press (or a
  // timer) before React commits must carry on from the first one, and the wall must pin the
  // new selection before a page turn or an arrival can land on it.
  const directorRef = useRef(state);
  const pinnedRef = useRef("");
  const send = useCallback(
    (event: DirectorEvent) => {
      directorRef.current = wallDirector(directorRef.current, event);
      dispatch(event);
      const ids = pinnedIds(directorRef.current);
      if (ids.join() === pinnedRef.current) return;
      pinnedRef.current = ids.join();
      pin(ids);
    },
    [pin],
  );

  // Each authoritative snapshot wins over local playpause, even if its value is unchanged; a host
  // that owns playback wins over the snapshot.
  useEffect(() => {
    send({ type: "setPaused", paused: hostPaused ?? wall.settings.playbackPaused });
  }, [hostPaused, send, wall.settings]);

  const filledSlots = useMemo(() => filledSlotsOf(wall.slots), [wall.slots]);
  const photoById = useCallback(
    (id: string | null): PhotoDTO | null => wall.pool.find((photo) => photo.id === id) ?? null,
    [wall.pool],
  );
  const selectedSlot = selectedId === null ? -1 : wall.slots.indexOf(selectedId);
  const selectedPhoto = useMemo(() => photoById(selectedId), [photoById, selectedId]);
  const nextUpPhoto = useMemo(() => photoById(nextUp), [nextUp, photoById]);

  const step = useCallback(
    (direction: 1 | -1, auto: boolean) => {
      const { page, event } = planStep(
        wallRef.current,
        directorRef.current,
        direction,
        auto,
        openEvery,
      );
      if (page) {
        turnPage(page);
        // A second press before React renders must carry on from the new page.
        wallRef.current = { ...wallRef.current, slots: page };
      }
      send(event);
    },
    [openEvery, send, turnPage],
  );

  useEffect(() => {
    if (paused || held) return;
    const timer = setTimeout(() => step(1, true), hurry ? HURRY_MS : selectEveryMs);
    return () => clearTimeout(timer);
  }, [cycle, held, hurry, paused, selectEveryMs, step]);

  // Where the selection was last seen, so a removed photo hands over to whatever replaced it.
  const lastSlot = useRef(0);
  useEffect(() => {
    if (selectedSlot !== -1) lastSlot.current = selectedSlot;
  }, [selectedSlot]);

  const hasPhotos = filledSlots.length > 0;
  useEffect(() => {
    if (selectedSlot === -1 && hasPhotos) {
      send({ type: "selectionEmptied", slots: wall.slots, slot: lastSlot.current });
    }
  }, [hasPhotos, selectedSlot, send, wall.slots]);

  // The next photo opens full screen when an arrival is queued, the next step is on the beat or
  // the viewer's slideshow is running: fetch its full image during the current photo's turn.
  const opensBig = opensNext(state, openEvery);
  const slideshow = spotlight && !autoSpotlight;
  const upcomingSlots = atPageEnd(wall.slots, selectedId, 1) ? nextPage(wall, 1) : wall.slots;
  const upcomingFilled = filledSlotsOf(upcomingSlots);
  const upcomingSlot =
    upcomingSlots === wall.slots
      ? upcomingFilled[(upcomingFilled.indexOf(selectedSlot) + 1) % upcomingFilled.length]
      : upcomingFilled[0];
  const upcomingId =
    nextUp ??
    ((slideshow || opensBig) && upcomingSlot !== undefined
      ? (upcomingSlots[upcomingSlot] ?? null)
      : null);
  const upcomingUrl = photoById(upcomingId)?.imageUrl;
  useEffect(() => {
    prefetchImage(upcomingUrl);
  }, [upcomingUrl]);

  const newest = wall.fresh[wall.fresh.length - 1];
  useEffect(() => {
    if (newest) send({ type: "arrival", photoId: newest });
  }, [newest, send]);

  const hasSelection = selectedPhoto !== null;
  const hasSelectionRef = useRef(hasSelection);
  useEffect(() => {
    hasSelectionRef.current = hasSelection;
  }, [hasSelection]);

  const lastSelect = useRef(0);
  const commands = useMemo<RemoteCommands>(
    () => ({
      select: () => {
        if (!hasSelectionRef.current) return;
        const now = Date.now();
        if (now - lastSelect.current < SELECT_DEBOUNCE_MS) return;
        lastSelect.current = now;
        send({ type: "toggleSpotlight" });
      },
      right: () => step(1, false),
      left: () => step(-1, false),
      back: () => send({ type: "closeSpotlight" }),
      playpause: () => send({ type: "togglePause" }),
    }),
    [send, step],
  );

  const poolIndex = wall.pool.findIndex((photo) => photo.id === selectedId);

  return {
    selectedSlot,
    selectedPhoto,
    nextUpPhoto,
    filledSlots,
    /** Place of the selected photo among all approved ones (newest is 1). */
    position: poolIndex + 1,
    total: wall.pool.length,
    /** Which set of photos is on screen, counted from the newest. */
    page: pageOf(wall) + 1,
    pages: pageCount(wall),
    spotlight,
    paused,
    durationMs: hurry ? HURRY_MS : selectEveryMs,
    /** The timer's next step opens its photo full screen (the footer shows it coming). */
    opensNext: opensBig && !slideshow,
    cycleKey: `${cycle}-${selectedId}`,
    commands,
  };
}

import { type RefObject, useEffect, useRef } from "react";

/** How far a sheet must be pulled down before letting go closes it. */
const CLOSE_DISTANCE_PX = 96;

/** A quick flick closes it from a shorter pull. */
const FLICK_DISTANCE_PX = 40;
const FLICK_SPEED_PX_PER_MS = 0.6;

/** How a sheet that wasn't pulled far enough slides back. */
const SETTLE_TRANSITION = "translate 200ms cubic-bezier(0.2, 0.9, 0.3, 1)";

/**
 * Pull a bottom sheet down to close it, as on a phone's own sheets. Only a pull that starts
 * while the sheet is scrolled to the top moves it, so scrolling its content still works.
 * It moves the sheet with `translate`, which leaves the entrance animation's transform alone.
 */
export function useSwipeToClose(
  sheet: RefObject<HTMLElement | null>,
  enabled: boolean,
  onClose: () => void,
) {
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const element = sheet.current;
    if (!element || !enabled) return;
    let start: { y: number; at: number } | null = null;
    let pulled = 0;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (event.touches.length !== 1 || !touch || element.scrollTop > 0) return;
      start = { y: touch.clientY, at: event.timeStamp };
      pulled = 0;
      element.style.transition = "none";
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!start || !touch) return;
      pulled = Math.max(0, touch.clientY - start.y);
      if (pulled === 0) return;
      // The sheet follows the finger instead of the page bouncing.
      event.preventDefault();
      element.style.translate = `0 ${pulled}px`;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!start) return;
      const speed = pulled / Math.max(1, event.timeStamp - start.at);
      start = null;
      const closing =
        pulled > CLOSE_DISTANCE_PX || (pulled > FLICK_DISTANCE_PX && speed > FLICK_SPEED_PX_PER_MS);
      if (closing) {
        latest.current();
        return;
      }
      element.style.transition = SETTLE_TRANSITION;
      element.style.translate = "";
    };

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);
    element.addEventListener("touchcancel", onTouchEnd);
    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
      // A sheet closed by a pull opens next time where it belongs.
      element.style.translate = "";
      element.style.transition = "";
    };
  }, [sheet, enabled]);
}

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "#composites";

/** jsdom has no Touch constructor, so the touch list is stubbed onto a plain event. */
const touch = (target: Element, type: string, clientY: number, timeStamp: number) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touches = type === "touchend" ? [] : [{ clientY }];
  Object.defineProperties(event, {
    touches: { value: touches },
    timeStamp: { value: timeStamp },
  });
  target.dispatchEvent(event);
  return event;
};

const pull = (sheet: Element, distance: number, durationMs: number) => {
  touch(sheet, "touchstart", 100, 0);
  const move = touch(sheet, "touchmove", 100 + distance, durationMs);
  touch(sheet, "touchend", 100 + distance, durationMs);
  return move;
};

describe("useSwipeToClose", () => {
  it("closes a sheet pulled far enough and lets a short, slow pull slide back", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open onClose={onClose} label="Photo" swipeToClose>
        <p>Content</p>
      </Dialog>,
    );
    const sheet = container.querySelector("dialog") as HTMLDialogElement;

    const move = pull(sheet, 30, 400);
    expect(move.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    expect(sheet.style.translate).toBe("");

    pull(sheet, 140, 400);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

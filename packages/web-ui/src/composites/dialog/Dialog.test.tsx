import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

function setup() {
  const onClose = vi.fn();
  render(
    <Dialog open onClose={onClose} label="Photo details">
      Details
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog", { hidden: true });
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
    left: 100,
    right: 400,
    top: 100,
    bottom: 400,
  } as DOMRect);
  return { dialog, onClose };
}

describe("Dialog dismissal", () => {
  it("keeps the dialog open when its own padding is clicked", () => {
    const { dialog, onClose } = setup();
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 110, clientY: 110 }));
    fireEvent.click(dialog, { clientX: 110, clientY: 110 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when a press starts and ends on the backdrop", () => {
    const { dialog, onClose } = setup();
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20 }));
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not dismiss when a drag starts inside and ends outside", () => {
    const { dialog, onClose } = setup();
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 110, clientY: 110 }));
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(onClose).not.toHaveBeenCalled();
  });
});

import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";

import { useSwipeToClose } from "#foundations";
import { cn } from "#foundations";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name; or point `labelledBy` at a visible heading. */
  label?: string;
  labelledBy?: string;
  /** sheet: slides up from the bottom (phones); center: a small alert; full: edge to edge. */
  variant?: "sheet" | "center" | "full";
  /** Sheet only: a grab handle on top, and pulling the sheet down closes it. */
  swipeToClose?: boolean;
  className?: string;
  children: ReactNode;
};

function isBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false;
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom
  );
}

const VARIANTS = {
  sheet:
    "mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-card border border-b-0 border-line bg-canvas animate-sheet-in lg:my-auto lg:max-w-lg lg:rounded-card lg:border-b",
  center:
    "m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-card border border-line bg-canvas animate-pop-in",
  full: "m-0 h-dvh max-h-none w-screen max-w-none bg-canvas animate-pop-in",
};

/**
 * A modal on the native `<dialog>`: focus is trapped and restored, Escape closes it and the
 * page behind is inert. Tapping the backdrop closes it too.
 */
export function Dialog({
  open,
  onClose,
  label,
  labelledBy,
  variant = "sheet",
  swipeToClose = false,
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const swipeable = swipeToClose && variant === "sheet";
  useSwipeToClose(ref, open && swipeable, onClose);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    else if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onPointerDown={(event) => {
        backdropPress.current = isBackdrop(event);
      }}
      onPointerCancel={() => {
        backdropPress.current = false;
      }}
      onClick={(event) => {
        const dismiss = backdropPress.current && isBackdrop(event);
        backdropPress.current = false;
        if (dismiss) onClose();
      }}
      className={cn(
        "max-h-[92dvh] overflow-y-auto overscroll-contain p-0 text-ink backdrop:bg-canvas/70 backdrop:backdrop-blur-sm",
        VARIANTS[variant],
        className,
      )}
    >
      {open && swipeable && (
        <div aria-hidden className="flex justify-center pt-2 lg:hidden">
          <span className="h-1 w-10 rounded-pill bg-ink-subtle/60" />
        </div>
      )}
      {open && children}
    </dialog>
  );
}

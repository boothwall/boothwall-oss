import type { MouseEvent, MouseEventHandler } from "react";

/**
 * A busy button stays enabled, so it keeps focus and its colour, but says it's busy and swallows
 * presses (including a form submit) until the work is done.
 */
export function loadingProps(
  loading: boolean,
  onClick: MouseEventHandler<HTMLButtonElement> | undefined,
) {
  if (!loading) return { onClick };
  return {
    "aria-busy": true,
    "aria-disabled": true,
    onClick: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  } as const;
}

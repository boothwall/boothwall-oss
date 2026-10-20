import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@boothwall/wall-ui/tokens";
import { type RefObject, useLayoutEffect, useState } from "react";

export interface CanvasFit {
  /** How far to scale the 960×540 wall to fit its box at 16:9. */
  scale: number;
  /** The axis with room left over around the canvas (a box wider than 16:9 is "x"). */
  spare: "x" | "y";
}

const fit = (width: number, height: number): CanvasFit => {
  const x = width / CANVAS_WIDTH;
  const y = height / CANVAS_HEIGHT;
  return { scale: Math.min(x, y), spare: x > y ? "x" : "y" };
};

/** The wall's scale for the element it fills (the window, or one side of /try), kept current. */
export function useCanvasScale(box: RefObject<HTMLElement | null>): CanvasFit {
  const [canvasFit, setCanvasFit] = useState(() => fit(window.innerWidth, window.innerHeight));
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => setCanvasFit(fit(element.clientWidth, element.clientHeight));
    measure();
    // jsdom (tests) has no ResizeObserver; every browser the wall runs in does.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [box]);
  return canvasFit;
}

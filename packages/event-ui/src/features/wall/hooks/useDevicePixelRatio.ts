import { useEffect, useState } from "react";

const current = () => window.devicePixelRatio || 1;

/** The screen's device pixel ratio, kept current when the window moves to another display. */
export function useDevicePixelRatio(): number {
  const [ratio, setRatio] = useState(current);
  useEffect(() => {
    // jsdom (tests) has no matchMedia; every browser the wall runs in does.
    if (typeof window.matchMedia !== "function") return;
    // Matches only the ratio it was made for, so its change event is the ratio changing.
    const query = window.matchMedia(`(resolution: ${ratio}dppx)`);
    const update = () => setRatio(current());
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [ratio]);
  return ratio;
}

import { useEffect, useState } from "react";

const TICK_MS = 250;

/** Seconds left until `endsAt`, updated a few times a second; calls `onEnd` once at zero. */
export function useCountdown(endsAt: number, onEnd: () => void) {
  const [now, setNow] = useState(Date.now);
  const left = Math.max(0, (endsAt - now) / 1000);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [endsAt]);

  useEffect(() => {
    if (left === 0) onEnd();
  }, [left, onEnd]);

  return left;
}

import { useEffect, useState } from "react";

/** The value, but a rise shows only `delayMs` later (a fall shows at once). */
export function useLateRise(value: number, delayMs: number) {
  const [shown, setShown] = useState(value);
  if (value < shown) setShown(value);
  useEffect(() => {
    if (value <= shown) return;
    const timer = setTimeout(() => setShown(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, shown, value]);
  return shown;
}

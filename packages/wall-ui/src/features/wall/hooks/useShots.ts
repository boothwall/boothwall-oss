import { useCallback, useEffect, useRef, useState } from "react";

export type Shot<T> = { key: number; value: T };

/** One-off effects that each stay mounted for `lifeMs`, then leave; several can overlap. */
export function useShots<T>(lifeMs: number) {
  const [shots, setShots] = useState<Shot<T>[]>([]);
  const next = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const fire = useCallback(
    (value: T) => {
      const key = next.current++;
      setShots((list) => [...list, { key, value }]);
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        setShots((list) => list.filter((shot) => shot.key !== key));
      }, lifeMs);
      timers.current.add(timer);
    },
    [lifeMs],
  );
  return [shots, fire] as const;
}

import { useCallback, useEffect, useRef } from "react";

import { useEventRuntime } from "./useEventRuntime";

/** Captures permission to finish work in this mounted event scope. */
export function useEventLease(ready = true) {
  const { transport } = useEventRuntime();
  const epoch = useRef(0);
  const mounted = useRef(false);
  const enabled = useRef(ready);
  enabled.current = ready;
  useEffect(() => {
    mounted.current = true;
    const current = ++epoch.current;
    return () => {
      mounted.current = false;
      epoch.current = current + 1;
    };
  }, [transport]);
  return useCallback(() => {
    const current = epoch.current;
    return () => mounted.current && current === epoch.current && enabled.current;
  }, []);
}

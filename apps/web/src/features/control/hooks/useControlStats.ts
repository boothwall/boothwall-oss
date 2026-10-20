import { usePolling } from "@boothwall/event-ui/browser-hooks";
import { EventApiError, useEventLease, useEventRuntime } from "@boothwall/event-ui/runtime";
import type { PhotoStatsDTO } from "@boothwall/shared";
import { useCallback, useMemo, useRef, useState } from "react";

import { createStatsClient } from "../data";

/** Midnight where this browser is: the booth's "today". */
function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * The stat tiles, every 5 s and after each decision. Informational: a failed read keeps the last
 * numbers quietly; only a refused passcode reaches `onAccessError`, which locks the panel.
 */
export function useControlStats(onAccessError: (error: EventApiError) => boolean) {
  const { transport } = useEventRuntime();
  const client = useMemo(() => createStatsClient(transport), [transport]);
  const capture = useEventLease();
  const revision = useRef(0);
  const [stats, setStats] = useState<PhotoStatsDTO | null>(null);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    const active = capture();
    try {
      const next = await client.fetchStats(startOfToday());
      if (active() && current === revision.current) setStats(next);
    } catch (error) {
      if (active() && error instanceof EventApiError) onAccessError(error);
    }
  }, [capture, client, onAccessError]);
  usePolling(refresh, 5000, true);
  return { stats, refresh };
}

import { EventApiError } from "@boothwall/event-ui/runtime";
import { useCallback, useState } from "react";

import { createStandaloneEventRuntime } from "@/platform/event";

import { controlCopy } from "../constants";
import { createStatsClient } from "../data";

/**
 * Checks a passcode against the API before the desk mounts, so a wrong one stays on the unlock
 * card instead of flashing the desk. Trouble other than the passcode lets the desk show its retry.
 */
export function useUnlock(
  accept: (passcode: string) => void,
  setError: (message: string | null) => void,
) {
  const [checking, setChecking] = useState(false);
  const unlock = useCallback(
    async (candidate: string) => {
      setChecking(true);
      setError(null);
      try {
        const { transport } = createStandaloneEventRuntime(() => candidate, "control");
        await createStatsClient(transport).fetchStats(new Date());
        accept(candidate);
      } catch (failure) {
        const status = failure instanceof EventApiError ? failure.status : 0;
        if (status === 401 || status === 403) setError(controlCopy.badPasscode);
        else if (status === 429) setError(controlCopy.locked);
        else accept(candidate);
      } finally {
        setChecking(false);
      }
    },
    [accept, setError],
  );
  return { unlock, checking };
}

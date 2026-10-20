import { type EventApiError, EventProvider } from "@boothwall/event-ui/runtime";
import { useCallback, useMemo } from "react";

import { createStandaloneEventRuntime } from "@/platform/event";

import { ControlDesk, UnlockScreen } from "../components";
import { controlCopy } from "../constants";
import { useControlSession, useUnlock } from "../hooks";

export function ControlPage() {
  const { passcode, setPasscode, error, setError } = useControlSession();
  const { unlock, checking } = useUnlock(setPasscode, setError);
  const runtime = useMemo(
    () => createStandaloneEventRuntime(() => passcode, "control"),
    [passcode],
  );
  const onAccessError = useCallback(
    (failure: EventApiError) => {
      if (![401, 403, 429].includes(failure.status)) return false;
      setPasscode("");
      setError(failure.status === 429 ? controlCopy.locked : controlCopy.badPasscode);
      return true;
    },
    [setPasscode, setError],
  );
  return (
    <EventProvider runtime={runtime}>
      {!passcode ? (
        <UnlockScreen onUnlock={(value) => void unlock(value)} error={error} checking={checking} />
      ) : (
        <ControlDesk onAccessError={onAccessError} onLock={() => setPasscode("")} />
      )}
    </EventProvider>
  );
}

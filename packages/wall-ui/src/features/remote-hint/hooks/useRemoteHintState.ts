import { useCallback, useEffect, useState } from "react";

import { REMOTE_HINT_MS } from "#features/remote-hint/constants/remoteHint.constants";

interface HintState {
  open: boolean;
  /** Counts the openings, so asking again while open restarts the countdown. */
  opened: number;
}

/**
 * The remote help card, on request only, so the wall opens clean. It closes by itself after
 * REMOTE_HINT_MS; the host closes it sooner on its own input (`hide`).
 */
export function useRemoteHintState() {
  const [state, setState] = useState<HintState>({ open: false, opened: 0 });
  const show = useCallback(
    () => setState(({ opened }) => ({ open: true, opened: opened + 1 })),
    [],
  );
  const hide = useCallback(() => setState((now) => (now.open ? { ...now, open: false } : now)), []);

  const { open, opened } = state;
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(hide, REMOTE_HINT_MS);
    return () => clearTimeout(timer);
  }, [hide, open, opened]);

  return { ...state, show, hide };
}

import type { WallSettings } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useEventLease, useEventRuntime } from "#runtime";

import { createSettingsClient } from "../data";

/** Live reads cannot replace a newer local save or another event's state. */
export function useLiveSettings(ready = true) {
  const { transport } = useEventRuntime();
  const client = useMemo(() => createSettingsClient(transport), [transport]);
  const capture = useEventLease(ready);
  const revision = useRef(0);
  const [settings, setSettings] = useState<WallSettings | null>(null);
  const [failed, setFailed] = useState(false);
  const replace = useCallback((next: WallSettings) => {
    revision.current++;
    setSettings(next);
    setFailed(false);
  }, []);
  const load = useCallback(() => {
    if (!ready) return;
    const current = ++revision.current;
    const active = capture();
    setFailed(false);
    client
      .fetchSettings()
      .then((next) => {
        if (active() && current === revision.current) setSettings(next);
      })
      .catch(() => {
        if (active() && current === revision.current) setFailed(true);
      });
  }, [client, capture, ready]);
  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);
  return { settings, failed, retry: load, replace };
}
export type LiveSettings = ReturnType<typeof useLiveSettings>;

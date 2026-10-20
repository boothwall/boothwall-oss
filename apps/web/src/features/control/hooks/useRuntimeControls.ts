import { usePolling } from "@boothwall/event-ui/browser-hooks";
import { useEventLease, useEventRuntime } from "@boothwall/event-ui/runtime";
import { createSettingsClient, useLiveSettings } from "@boothwall/event-ui/settings";
import type { RuntimeSettingsPatch } from "@boothwall/shared";
import { useMemo, useRef, useState } from "react";

export function useRuntimeControls(onFailure: (error: unknown) => void, onSuccess: () => void) {
  const { transport } = useEventRuntime();
  const client = useMemo(() => createSettingsClient(transport), [transport]);
  const live = useLiveSettings();
  const capture = useEventLease();
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  usePolling(live.retry, 5000, true);
  const save = async (patch: RuntimeSettingsPatch) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    const active = capture();
    try {
      const settings = await client.saveRuntimeState(patch);
      if (active()) {
        live.replace(settings);
        onSuccess();
      }
    } catch (error) {
      if (active()) onFailure(error);
    } finally {
      saving.current = false;
      if (active()) setBusy(false);
    }
  };
  return { ...live, busy, save };
}

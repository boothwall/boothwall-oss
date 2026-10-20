import { createControlClient } from "@boothwall/event-ui/control-client";
import { useEventLease, useEventRuntime } from "@boothwall/event-ui/runtime";
import type { HostMessage } from "@boothwall/shared";
import { useEffect, useMemo, useRef, useState } from "react";

export type TvRequestState = "idle" | "sending" | "sent";

/** How long "Sent" stays: the request reached the API, not necessarily a TV. */
export const TV_REQUEST_SENT_MS = 4000;

/** Asks the wall for a photo call, the remote's help or the next theme, one request at a time. */
export function useTvRequest(
  message: HostMessage,
  onFailure: (error: unknown) => void,
  onSuccess: () => void,
) {
  const { transport } = useEventRuntime();
  const client = useMemo(() => createControlClient(transport), [transport]);
  const capture = useEventLease();
  const sending = useRef(false);
  const [state, setState] = useState<TvRequestState>("idle");
  useEffect(() => {
    if (state !== "sent") return;
    const timer = setTimeout(() => setState("idle"), TV_REQUEST_SENT_MS);
    return () => clearTimeout(timer);
  }, [state]);
  const send = async () => {
    if (sending.current) return;
    sending.current = true;
    setState("sending");
    const active = capture();
    try {
      await client.askTv(message);
      if (active()) {
        setState("sent");
        onSuccess();
      }
    } catch (error) {
      if (active()) {
        setState("idle");
        onFailure(error);
      }
    } finally {
      sending.current = false;
    }
  };
  return { state, send };
}

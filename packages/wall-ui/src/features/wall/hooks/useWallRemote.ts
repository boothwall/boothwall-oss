import { useCallback, useEffect, useRef, useState } from "react";

import type { RemoteInputHook } from "#platform/input";
import { exitApp, useBackButton } from "#platform/input";

import { EXIT_CONFIRM_MS } from "../constants/timing";
import type { RemoteCommands } from "./useWallDirector";

/**
 * Booth kiosk: Back closes the spotlight first. On the wall it takes a second press within
 * EXIT_CONFIRM_MS to exit, so a visitor bumping the remote can't close the booth screen. A host
 * that owns Back (a TV menu) gets the hardware press instead: the wall then never arms an exit.
 */
export function useWallRemote(
  commands: RemoteCommands,
  spotlight: boolean,
  useRemoteInput: RemoteInputHook,
  hostBack = false,
) {
  useRemoteInput(commands);
  const [exitArmed, setExitArmed] = useState(false);
  const armedAt = useRef(0);
  const spotlightRef = useRef(spotlight);
  spotlightRef.current = spotlight;

  const onBack = useCallback(() => {
    if (hostBack) return false;
    if (spotlightRef.current) {
      commands.back();
      return true;
    }
    const now = Date.now();
    if (now - armedAt.current < EXIT_CONFIRM_MS) {
      exitApp();
      return true;
    }
    armedAt.current = now;
    setExitArmed(true);
    return true;
  }, [commands, hostBack]);

  useBackButton(onBack);

  useEffect(() => {
    if (!exitArmed) return;
    const timer = setTimeout(() => setExitArmed(false), EXIT_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [exitArmed]);

  return { exitArmed };
}

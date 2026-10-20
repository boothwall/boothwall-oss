import type { RemoteHandlers } from "@boothwall/wall-ui";
import { useContext, useEffect } from "react";

import { useVegaRemote } from "@/platform/input";

import { wallInput } from "../state/wallInput";
import { WallInputContext } from "../state/WallInputContext";

const NONE: RemoteHandlers = {};

/** The wall's remote input, routed past it while an overlay has the screen. */
export function useWallRemoteInput(handlers: RemoteHandlers) {
  const { captured, onCaptured, onLongSelect, onMenu } = useContext(WallInputContext);
  useVegaRemote(captured ? NONE : handlers, {
    onCaptured,
    onLongSelect,
    onMenu: captured ? undefined : onMenu,
  });
  // Media keys and Alexa reach the wall through wallInput; an overlay that has the screen keeps them.
  useEffect(() => {
    if (captured) return;
    wallInput.handlers = handlers;
    return () => {
      if (wallInput.handlers === handlers) wallInput.handlers = null;
    };
  }, [captured, handlers]);
  useEffect(() => {
    if (!onCaptured) return;
    wallInput.onCaptured = onCaptured;
    return () => {
      if (wallInput.onCaptured === onCaptured) wallInput.onCaptured = null;
    };
  }, [onCaptured]);
}

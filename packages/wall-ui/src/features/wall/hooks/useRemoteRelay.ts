import {
  type HostMessage,
  hostMessageSchema,
  type RemoteMessage,
  type WallTheme,
} from "@boothwall/shared";
import { type RefObject, useCallback, useEffect, useRef } from "react";

import type { RemoteCommands } from "./wall-director.types";

/** The host's handlers for the host messages, as the wall screen receives them. */
export type HostRequests = {
  onPhotoCallRequest?: () => void;
  onHintsRequest?: () => void;
  /** Told the theme on screen, so the host can show the next one. */
  onThemeRequest?: (shown: WallTheme) => void;
};

const HANDLER = {
  photocall: "onPhotoCallRequest",
  hints: "onHintsRequest",
} as const satisfies Record<Exclude<HostMessage, "theme">, keyof HostRequests>;

const isHostMessage = (message: RemoteMessage): message is HostMessage =>
  hostMessageSchema.safeParse(message).success;

/** The phone remote's messages: host messages go to the host, which may offer them; buttons to the wall. */
export function useRemoteRelay(
  commands: RefObject<RemoteCommands | null>,
  requests: HostRequests,
  shownTheme: RefObject<WallTheme>,
) {
  const host = useRef(requests);
  useEffect(() => {
    host.current = requests;
  });
  return useCallback(
    (message: RemoteMessage) => {
      if (!isHostMessage(message)) commands.current?.[message]();
      else if (message === "theme") host.current.onThemeRequest?.(shownTheme.current);
      else host.current[HANDLER[message]]?.();
    },
    [commands, shownTheme],
  );
}

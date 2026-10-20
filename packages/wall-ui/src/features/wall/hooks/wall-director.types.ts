import type { RemoteCommand } from "@boothwall/shared";

import type { WallState } from "../state/wallState";

export type RemoteCommands = Record<RemoteCommand, () => void>;

export type WallDirectorOptions = {
  wall: WallState;
  /** Replaces every card with a new page. */
  turnPage: (slots: (string | null)[]) => void;
  /** Tells the wall which photos must stay put (see `WallState.pinned`). */
  pin: (ids: string[]) => void;
  /** How long each photo stays selected (a live setting). */
  selectEveryMs: number;
  /** Open every `OPEN_EVERY_STEPS`th photo (and live arrivals) full screen (a live setting). */
  autoOpen: boolean;
  /** Something else has the screen (a pick, the end of the event): the wall holds still. */
  held?: boolean;
  /** Playback pause owned by the host; when set it wins over the wall's settings. */
  paused?: boolean;
};

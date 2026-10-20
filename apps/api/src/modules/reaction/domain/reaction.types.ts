import type { Reaction, ReactionCounts, WallId } from "@boothwall/shared";

import type { Db } from "@/db/client";

/** The wall's realtime room as reactions need it (implemented by the wall module). */
export type ReactionRoom = {
  /** Takes one tap from a client; false once it is over the limit. */
  allow(
    fingerprints: { current: string; legacy: string },
    limit: { max: number; windowMs: number },
  ): Promise<boolean>;
  /** Hands the new totals over for the next batched `photo.reactions` event. */
  queue(photoId: string, counts: ReactionCounts): Promise<void>;
};

/** Per-request collaborators; built from Worker bindings in the routes. */
export type ReactionDeps = {
  fingerprintKey?: string;
  db: Db;
  wallId: WallId;
  room: ReactionRoom;
  now?: () => Date;
};

export type ReactArgs = {
  photoId: string;
  reaction: Reaction;
  clientIp: string;
};

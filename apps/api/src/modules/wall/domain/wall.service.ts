import {
  type ControlEvent,
  DEFAULT_WALL_ID,
  type ReactionCounts,
  type WallEvent,
  type WallId,
} from "@boothwall/shared";

import type { WallRoomNamespace } from "@/contracts/runtime";
import type { SocketRole } from "@/modules/wall/realtime/wall.room";

/**
 * The Durable Object name for a wall's room. The default wall keeps the name it had before
 * walls had ids, so a running deployment keeps the same object.
 */
export const roomName = (wallId: WallId) =>
  wallId === DEFAULT_WALL_ID ? "main" : `wall:${wallId}`;

const room = (namespace: WallRoomNamespace, wallId: WallId) =>
  namespace.get(namespace.idFromName(roomName(wallId)));

export const wallService = {
  broadcaster(namespace: WallRoomNamespace, wallId: WallId) {
    return {
      async broadcast(event: WallEvent) {
        await room(namespace, wallId).broadcast(JSON.stringify(event));
      },
    };
  },

  /** Events for connected Control panels only; walls and guests never get these. */
  controlNotifier(namespace: WallRoomNamespace, wallId: WallId) {
    return {
      async notify(event: ControlEvent) {
        await room(namespace, wallId).notifyControl(JSON.stringify(event));
      },
    };
  },

  /** Reaction plumbing that lives in the room: the per-client limit and the batched push. */
  reactions(namespace: WallRoomNamespace, wallId: WallId) {
    return {
      allow(
        fingerprints: { current: string; legacy: string },
        limit: { max: number; windowMs: number },
      ): Promise<boolean> {
        return room(namespace, wallId).allowClientReaction(
          fingerprints.current,
          limit.max,
          limit.windowMs,
          fingerprints.legacy,
        );
      },
      async queue(photoId: string, counts: ReactionCounts): Promise<void> {
        await room(namespace, wallId).queueReactions(photoId, counts);
      },
    };
  },

  /**
   * Hands a WebSocket upgrade to the wall's room. The room learns the role from the path set
   * here, never from anything the client sent.
   */
  connect(
    namespace: WallRoomNamespace,
    wallId: WallId,
    request: Request,
    role: SocketRole,
    generation?: number,
  ): Promise<Response> {
    const url = new URL(`https://room/${role}`);
    if (generation !== undefined) url.searchParams.set("generation", String(generation));
    return room(namespace, wallId).fetch(new Request(url, request));
  },
};

/** Close current connections; permanent invalidation also rejects future room upgrades. */
export async function invalidateWallRoom(
  namespace: WallRoomNamespace,
  wallId: WallId,
  permanent = false,
  generation?: number,
): Promise<void> {
  await room(namespace, wallId).invalidate(permanent, generation);
}

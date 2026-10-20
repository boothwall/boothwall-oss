export * from "./control-room";
export type { ControlLease, ControlLeaseRevocation, WallRoomNamespace } from "@/contracts/runtime";
export { invalidateWallRoom } from "@/modules/wall/domain/wall.service";

import type { WallEvent, WallId } from "@boothwall/shared";

import { wallService } from "@/modules/wall/domain/wall.service";
export const broadcastWallEvent = (
  namespace: Parameters<typeof wallService.broadcaster>[0],
  wallId: WallId,
  event: WallEvent,
): Promise<void> => wallService.broadcaster(namespace, wallId).broadcast(event);

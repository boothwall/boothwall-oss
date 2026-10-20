import type { WallId } from "@boothwall/shared";

import type { ControlLease, ControlLeaseRevocation, WallRoomNamespace } from "@/contracts/runtime";
import { roomName } from "@/modules/wall/domain/wall.service";

/** The host authorizes a one-use lease before this trusted room handoff. */
export function connectControlRoom(
  namespace: WallRoomNamespace,
  wallId: WallId,
  request: Request,
  lease: ControlLease,
  generation: number,
): Promise<Response> {
  const url = new URL("https://room/control");
  url.searchParams.set("generation", String(generation));
  url.searchParams.set("lease", lease.id);
  url.searchParams.set("admissionExpiresAt", String(lease.admissionExpiresAt));
  url.searchParams.set("connectionExpiresAt", String(lease.connectionExpiresAt));
  return namespace.get(namespace.idFromName(roomName(wallId))).fetch(new Request(url, request));
}

export function revokeControlRoom(
  namespace: WallRoomNamespace,
  wallId: WallId,
  leases: ControlLeaseRevocation[],
): Promise<void> {
  return namespace.get(namespace.idFromName(roomName(wallId))).revokeControls(leases);
}

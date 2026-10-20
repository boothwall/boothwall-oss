import type { ReactionCounts } from "@boothwall/shared";

import type { ControlLeaseRevocation } from "./control-lease.types";

/** The RPC protocol, independent of the room implementation and HTTP modules. */
export interface WallRoomContract extends Rpc.DurableObjectBranded {
  broadcast(message: string): number;
  notifyControl(message: string): number;
  allowClientReaction(current: string, max: number, windowMs: number, legacy: string): boolean;
  queueReactions(photoId: string, counts: ReactionCounts): Promise<void>;
  invalidate(permanent?: boolean, generation?: number): Promise<void>;
  revokeControls(leases: ControlLeaseRevocation[]): Promise<void>;
}

/** Only the binding methods used by the core; concrete rooms retain their full RPC type. */
export type WallRoomNamespace = Pick<DurableObjectNamespace, "idFromName"> & {
  get(
    id: DurableObjectId,
  ): Pick<
    DurableObjectStub<WallRoomContract>,
    | "fetch"
    | "broadcast"
    | "notifyControl"
    | "allowClientReaction"
    | "queueReactions"
    | "invalidate"
    | "revokeControls"
  >;
};

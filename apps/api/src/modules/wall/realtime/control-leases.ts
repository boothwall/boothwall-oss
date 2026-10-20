import type { ControlLease, ControlLeaseRevocation } from "@/contracts/runtime";

import {
  CONTROL_ADMISSION_MS,
  socketControlLease,
  validControlLeaseId,
} from "./control-lease.utils";

const PREFIX = "control-lease:";
const closeControl = (socket: WebSocket) => {
  // Closing sockets may still be returned by getWebSockets; mark them before sending.
  socket.serializeAttachment({ ...socket.deserializeAttachment(), controlRevoked: true });
  try {
    socket.send(JSON.stringify({ type: "wall.access-changed", permanent: false }));
    socket.close(1008, "Control access changed");
  } catch {
    /* Already disconnected. */
  }
};

/** Room-local one-use admission and durable revocation barrier; host owns identity policy. */
export class ControlLeases {
  constructor(private readonly ctx: DurableObjectState) {}

  async admit(lease: ControlLease, now: number): Promise<boolean> {
    if (lease.admissionExpiresAt <= now || lease.connectionExpiresAt <= now) return false;
    await this.prune(now);
    if (await this.ctx.storage.get(PREFIX + lease.id)) return false;
    // Consumed and revoked tickets share a tombstone. Persist before accepting a socket.
    await this.ctx.storage.put(PREFIX + lease.id, lease.admissionExpiresAt);
    return true;
  }

  async revoke(leases: ControlLeaseRevocation[], now: number): Promise<void> {
    if (
      leases.length > 100 ||
      leases.some(
        (lease) =>
          !validControlLeaseId(lease.id) ||
          !Number.isSafeInteger(lease.admissionExpiresAt) ||
          lease.admissionExpiresAt > now + CONTROL_ADMISSION_MS,
      )
    )
      throw new Error("Invalid Control revocation");
    const ids = new Set(leases.map((lease) => lease.id));
    // Expired tickets cannot be admitted, but their existing connections still need closing.
    const tombstones: Record<string, number> = {};
    for (const lease of leases) {
      const previous = (await this.ctx.storage.get<number>(PREFIX + lease.id)) ?? 0;
      const expiry = Math.max(previous, lease.admissionExpiresAt);
      if (expiry > now) tombstones[PREFIX + lease.id] = expiry;
    }
    if (Object.keys(tombstones).length) await this.ctx.storage.put(tombstones);
    for (const socket of this.ctx.getWebSockets("control")) {
      const lease = socketControlLease(socket);
      if (lease && ids.has(lease.id)) closeControl(socket);
    }
    await this.prune(now);
  }

  deliverable(socket: WebSocket, now: number): boolean {
    if (socket.deserializeAttachment?.()?.controlRevoked) return false;
    const lease = socketControlLease(socket);
    if (!lease || lease.connectionExpiresAt > now) return true;
    closeControl(socket);
    return false;
  }

  private async prune(now: number): Promise<void> {
    const rows = await this.ctx.storage.list<number>({ prefix: PREFIX, limit: 1000 });
    const expired = [...rows].filter(([, expiry]) => expiry <= now).map(([key]) => key);
    if (expired.length) await this.ctx.storage.delete(expired);
  }
}

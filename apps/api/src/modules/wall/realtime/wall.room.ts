import type { ReactionCounts, WallEvent } from "@boothwall/shared";
import { DurableObject } from "cloudflare:workers";

import type { AppBindings, ControlLeaseRevocation, WallRoomContract } from "@/contracts/runtime";

import { ClientLimiter } from "./client-limiter";
import { readControlLease } from "./control-lease.utils";
import { ControlLeases } from "./control-leases";
import { ReactionBatch } from "./reaction-batch";

const MAX_SOCKETS = 50;

/** At most one `photo.reactions` per photo this often, however fast guests tap. */
export const REACTION_BATCH_MS = 2000;

/** Screens get wall events; Control panels get those and control events too. */
export type SocketRole = "screen" | "control";

/** The role `wallService.connect` put in the path. Anything else is a screen. */
const roleOf = (request: Request): SocketRole =>
  new URL(request.url).pathname === "/control" ? "control" : "screen";

/** Hibernatable sockets: idle walls cost nothing and pings are answered without waking it. */
export class WallRoom extends DurableObject<AppBindings> implements WallRoomContract {
  // In memory on purpose: counts are saved in D1 before they get here, and the socket is a
  // hint (screens re-read the snapshot on reconnect), so losing these on eviction is fine.
  private readonly reactions = new ReactionBatch();
  private readonly reactionLimiter = new ClientLimiter();
  private readonly controlLeases: ControlLeases;

  constructor(ctx: DurableObjectState, env: AppBindings) {
    super(ctx, env);
    this.controlLeases = new ControlLeases(ctx);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  override async fetch(request: Request): Promise<Response> {
    return this.ctx.blockConcurrencyWhile(async () => {
      if (await this.ctx.storage.get<boolean>("inactive"))
        return new Response("Wall unavailable", { status: 410 });
      const minimum = (await this.ctx.storage.get<number>("minimum-generation")) ?? 0;
      const raw = new URL(request.url).searchParams.get("generation");
      const generation = raw === null ? undefined : Number(raw);
      if (
        (generation !== undefined && (!Number.isSafeInteger(generation) || generation < 0)) ||
        (minimum > 0 && (generation === undefined || generation < minimum))
      )
        return new Response("Wall access changed", { status: 410 });
      // The fence check and registration cannot interleave with invalidation.
      if (this.ctx.getWebSockets().length >= MAX_SOCKETS)
        return new Response("Too many screens connected", { status: 503 });
      const lease = readControlLease(new URL(request.url), Date.now());
      if (lease === false || (lease && !(await this.controlLeases.admit(lease, Date.now()))))
        return new Response("Control access changed", { status: 410 });
      const { 0: client, 1: server } = new WebSocketPair();
      if (lease) server.serializeAttachment({ controlLease: lease });
      this.ctx.acceptWebSocket(server, [roleOf(request)]);
      return new Response(null, { status: 101, webSocket: client });
    });
  }

  /** Fence specific opaque host authorities without changing display access or other hosts. */
  async revokeControls(leases: ControlLeaseRevocation[]): Promise<void> {
    await this.ctx.blockConcurrencyWhile(() => this.controlLeases.revoke(leases, Date.now()));
  }

  /** RPC: revoke current connections; a deleted room stays inactive across hibernation. */
  async invalidate(permanent = false, generation?: number): Promise<void> {
    await this.ctx.blockConcurrencyWhile(async () => {
      if (generation !== undefined) {
        if (!Number.isSafeInteger(generation) || generation < 0)
          throw new Error("Invalid generation");
        const minimum = (await this.ctx.storage.get<number>("minimum-generation")) ?? 0;
        if (!permanent && generation <= minimum) return;
        await this.ctx.storage.put("minimum-generation", Math.max(minimum, generation));
      }
      if (permanent) await this.ctx.storage.put("inactive", true);
      for (const socket of this.ctx.getWebSockets()) {
        try {
          socket.send(
            JSON.stringify({ type: "wall.access-changed", permanent } satisfies WallEvent),
          );
          socket.close(1008, "Wall access changed");
        } catch {
          /* Already closed. */
        }
      }
    });
  }

  /** RPC: fan a serialized wall event out to every connected screen and Control panel. */
  broadcast(message: string): number {
    return this.send(this.ctx.getWebSockets(), message);
  }

  /** RPC: a serialized control event, for connected Control panels only. */
  notifyControl(message: string): number {
    return this.send(this.ctx.getWebSockets("control"), message);
  }

  /** Old callers cannot create a separate unkeyed counter after the protocol cutover. */
  allowReaction(): boolean {
    return false;
  }

  /** New callers cannot silently use an old room: this RPC did not exist before the cutover. */
  allowClientReaction(current: string, max: number, windowMs: number, legacy: string): boolean {
    if (!/^hmac-v1:[0-9a-f]{64}$/.test(current) || !/^[0-9a-f]{64}$/.test(legacy))
      throw new Error("Invalid client fingerprint protocol");
    return this.reactionLimiter.take(current, max, windowMs, Date.now(), legacy);
  }

  /** RPC: a photo's new reaction totals. The first change in a batch sets the flush alarm. */
  async queueReactions(photoId: string, counts: ReactionCounts): Promise<void> {
    if (this.reactions.add(photoId, counts)) {
      await this.ctx.storage.setAlarm(Date.now() + REACTION_BATCH_MS);
    }
  }

  /** Flushes the batch: one event per photo that got reactions since the last flush. */
  override alarm(): void {
    for (const { photoId, counts } of this.reactions.drain()) {
      const event: WallEvent = { type: "photo.reactions", photoId, counts };
      this.broadcast(JSON.stringify(event));
    }
  }

  private send(sockets: WebSocket[], message: string): number {
    let sent = 0;
    for (const socket of sockets) {
      if (!this.controlLeases.deliverable(socket, Date.now())) continue;
      try {
        socket.send(message);
        sent++;
      } catch {
        // Socket already closing; the runtime cleans it up.
      }
    }
    return sent;
  }

  override webSocketClose(socket: WebSocket, code: number, reason: string): void {
    try {
      socket.close(code, reason);
    } catch {
      // 1005/1006 can't be echoed back; the socket is gone either way.
    }
  }
}

import type { WallId } from "@boothwall/shared";

import { hmacHex, safeEqual } from "@/core/security/crypto";

/** Long enough to open the socket, short enough that a ticket seen in a log is useless. */
export const CONTROL_TICKET_TTL_MS = 60_000;

const signature = async (key: string, wallId: WallId, expiresAt: number, generation?: number) =>
  (
    await hmacHex(
      key,
      `control-ticket:${wallId}:${expiresAt}${generation === undefined ? "" : `:generation:${generation}`}`,
    )
  ).slice(0, 32);

/**
 * A pass for the Control panel's socket. Browsers can't send an Authorization header when they
 * open a WebSocket, so the panel trades its passcode for one of these first: `<expiry>.<hmac>`.
 */
export const controlTicket = {
  async issue(key: string, wallId: WallId, now: Date, generation?: number): Promise<string> {
    const expiresAt = now.getTime() + CONTROL_TICKET_TTL_MS;
    return `${expiresAt}.${await signature(key, wallId, expiresAt, generation)}`;
  },

  async verify(
    key: string,
    wallId: WallId,
    ticket: string,
    now: Date,
    generation?: number,
  ): Promise<boolean> {
    const [expiry, mac, ...rest] = ticket.split(".");
    const expiresAt = Number(expiry);
    if (rest.length > 0 || !mac || !Number.isSafeInteger(expiresAt)) return false;
    if (expiresAt < now.getTime() || expiresAt > now.getTime() + CONTROL_TICKET_TTL_MS) {
      return false;
    }
    return safeEqual(mac, await signature(key, wallId, expiresAt, generation));
  },
};

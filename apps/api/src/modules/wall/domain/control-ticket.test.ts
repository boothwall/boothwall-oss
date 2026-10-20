import { DEFAULT_WALL_ID } from "@boothwall/shared";
import { describe, expect, it } from "vitest";

import { CONTROL_TICKET_TTL_MS, controlTicket } from "./control-ticket";

const KEY = "test-passcode";
const now = new Date("2026-10-11T12:00:00.000Z");
const later = (ms: number) => new Date(now.getTime() + ms);

describe("control socket tickets", () => {
  it("binds a second wall's tickets to the authorization generation", async () => {
    const ticket = await controlTicket.issue(KEY, "second-wall", now, 1);
    expect(await controlTicket.verify(KEY, "second-wall", ticket, now, 1)).toBe(true);
    expect(await controlTicket.verify(KEY, "second-wall", ticket, now, 2)).toBe(false);
    expect(await controlTicket.verify(KEY, "second-wall", ticket, now)).toBe(false);
  });
  it("open the socket for a minute, for this wall only, and can't be forged", async () => {
    const ticket = await controlTicket.issue(KEY, DEFAULT_WALL_ID, now);

    expect(await controlTicket.verify(KEY, DEFAULT_WALL_ID, ticket, later(1000))).toBe(true);
    expect(
      await controlTicket.verify(KEY, DEFAULT_WALL_ID, ticket, later(CONTROL_TICKET_TTL_MS + 1)),
    ).toBe(false);
    expect(await controlTicket.verify(KEY, "another-wall", ticket, now)).toBe(false);
    expect(await controlTicket.verify("other-passcode", DEFAULT_WALL_ID, ticket, now)).toBe(false);

    const [expiry] = ticket.split(".");
    const stretched = `${Number(expiry) + 3_600_000}.${ticket.split(".")[1]}`;
    for (const forged of [stretched, "", "abc", `${expiry}.`, `${ticket}.x`]) {
      expect(await controlTicket.verify(KEY, DEFAULT_WALL_ID, forged, now)).toBe(false);
    }
  });
});

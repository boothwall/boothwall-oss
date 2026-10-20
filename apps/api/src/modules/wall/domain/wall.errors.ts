import { badRequest, forbidden } from "@/core/http/errors";

export const WALL_WEBSOCKET_REQUIRED = "WALL_WEBSOCKET_REQUIRED" as const;
export const WALL_CONTROL_TICKET_INVALID = "WALL_CONTROL_TICKET_INVALID" as const;

export const wallWebSocketRequired = () =>
  badRequest(WALL_WEBSOCKET_REQUIRED, undefined, "wall.websocketRequired");

/** A missing, expired or forged ticket for the Control panel's socket. */
export const wallControlTicketInvalid = () =>
  forbidden(WALL_CONTROL_TICKET_INVALID, undefined, "wall.controlTicketInvalid");

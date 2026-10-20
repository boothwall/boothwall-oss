import { z } from "zod";

import { photoAnalysisSchema } from "#moderation";

/** The Control panel's live socket. It needs a ticket from POST CONTROL_TICKET_PATH. */
export const CONTROL_SOCKET_PATH = "/wall/control";
export const CONTROL_TICKET_PATH = "/wall/control/ticket";

/** Response of POST /wall/control/ticket: a short-lived pass for the control socket. */
export const controlTicketSchema = z.object({ ticket: z.string().min(1) });

export type ControlTicketDTO = z.infer<typeof controlTicketSchema>;

/**
 * Messages only the Control panel receives. Its socket also gets every wall event; this is
 * the part that never reaches walls or guests.
 */
export const controlEventSchema = z.discriminatedUnion("type", [
  /** The smart check finished with a photo. */
  z.object({
    type: z.literal("photo.analysis"),
    photoId: z.string().min(1),
    analysis: photoAnalysisSchema,
  }),
]);

export type ControlEvent = z.infer<typeof controlEventSchema>;

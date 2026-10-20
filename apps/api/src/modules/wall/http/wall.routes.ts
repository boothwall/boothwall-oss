import { type ControlTicketDTO, remoteMessageSchema } from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";

import { badRequest } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { noContent, ok } from "@/core/http/response";
import { rethrow } from "@/core/http/validation";
import { adminOnly, requireAdmin } from "@/modules/auth";
import { controlTicket } from "@/modules/wall/domain/control-ticket";
import { wallControlTicketInvalid, wallWebSocketRequired } from "@/modules/wall/domain/wall.errors";
import { wallService } from "@/modules/wall/domain/wall.service";
import type { SocketRole } from "@/modules/wall/realtime/wall.room";

const remoteBodySchema = z.object({ command: remoteMessageSchema });
const controlSocketQuerySchema = z.object({ ticket: z.string().max(100) });

const upgrade = (c: Context<AppEnv>, role: SocketRole) => {
  if (c.req.header("upgrade")?.toLowerCase() !== "websocket") throw wallWebSocketRequired();
  return wallService.connect(c.env.WALL, c.get("wallId"), c.req.raw, role, c.get("roomGeneration"));
};

export const wallRouter = new Hono<AppEnv>()
  .get("/live", (c) => upgrade(c, "screen"))
  // The Control panel's socket: wall events plus control events (smart moderation verdicts).
  .post("/control/ticket", adminOnly, async (c) =>
    ok<ControlTicketDTO>(c, {
      ticket: await controlTicket.issue(
        c.get("config").ADMIN_TOKEN,
        c.get("wallId"),
        new Date(),
        c.get("roomGeneration"),
      ),
    }),
  )
  .get("/control", zValidator("query", controlSocketQuerySchema, rethrow), async (c) => {
    const valid = await controlTicket.verify(
      c.get("config").ADMIN_TOKEN,
      c.get("wallId"),
      c.req.valid("query").ticket,
      new Date(),
      c.get("roomGeneration"),
    );
    if (!valid) throw wallControlTicketInvalid();
    return upgrade(c, "control");
  })
  // Phone remote for the booth: relays a button press to every connected wall.
  .post(
    "/remote",
    bodyLimit({
      maxSize: 1024,
      onError: () => {
        throw badRequest("WALL_REMOTE_BODY_TOO_LARGE");
      },
    }),
    zValidator("json", remoteBodySchema, rethrow),
    async (c) => {
      await requireAdmin(c);
      await wallService.broadcaster(c.env.WALL, c.get("wallId")).broadcast({
        type: "remote.command",
        command: c.req.valid("json").command,
      });
      return noContent(c);
    },
  );

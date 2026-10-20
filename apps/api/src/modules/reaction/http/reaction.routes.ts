import { reactionBodySchema } from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { badRequest } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { clientIp } from "@/core/http/request-ip";
import { ok } from "@/core/http/response";
import { rethrow } from "@/core/http/validation";
import { createDb } from "@/db/client";
import { reactionService } from "@/modules/reaction/domain/reaction.service";
import { wallService } from "@/modules/wall";

import { reactionParamSchema } from "./reaction.schemas";

/** `{"reaction":"heart"}` and a little slack. */
const MAX_REACTION_BODY = 256;

/** Mounted under /photos. Public: guests react from the phone feed. */
export const reactionRouter = new Hono<AppEnv>().post(
  "/:id/reactions",
  bodyLimit({
    maxSize: MAX_REACTION_BODY,
    onError: () => {
      throw badRequest("REACTION_BODY_TOO_LARGE");
    },
  }),
  zValidator("param", reactionParamSchema, rethrow),
  zValidator("json", reactionBodySchema, rethrow),
  async (c) => {
    const wallId = c.get("wallId");
    const result = await reactionService.react(
      {
        db: createDb(c.env.DB),
        wallId,
        fingerprintKey: c.get("config").CLIENT_FINGERPRINT_KEY,
        room: wallService.reactions(c.env.WALL, wallId),
      },
      {
        photoId: c.req.valid("param").id,
        reaction: c.req.valid("json").reaction,
        clientIp: clientIp(c),
      },
    );
    return ok(c, result);
  },
);

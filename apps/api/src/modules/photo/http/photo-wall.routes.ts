import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import type { AppEnv } from "@/core/http/http-context";
import { ok } from "@/core/http/response";
import { rethrow } from "@/core/http/validation";
import { photoService } from "@/modules/photo/domain/photo.service";
import { settingsService } from "@/modules/settings";

import { depsFrom } from "./photo.deps";
import { listPhotosQuerySchema, photoIdParamSchema } from "./photo.schemas";
import { photoUploadHandler, photoUploadLimit } from "./photo-upload.handler";

/**
 * The guest's side of /photos: the public wall snapshot and the upload share the wall's live
 * settings; a sender asks how their own photo is doing with its delete token.
 */
export const photoWallRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", listPhotosQuerySchema, rethrow), async (c) => {
    const deps = depsFrom(c);
    const [wall, settings] = await Promise.all([
      photoService.getWall(deps, c.req.valid("query").limit),
      settingsService.get(deps.db, deps.wallId, c.get("settingsAuthority")),
    ]);
    return ok(c, { ...wall, settings });
  })
  .post("/", photoUploadLimit, photoUploadHandler("guest"))
  .get("/:id/status", zValidator("param", photoIdParamSchema, rethrow), async (c) => {
    c.header("cache-control", "no-store");
    return ok(
      c,
      await photoService.guestStatus(
        depsFrom(c),
        c.req.valid("param").id,
        c.req.header("x-delete-token"),
      ),
    );
  });

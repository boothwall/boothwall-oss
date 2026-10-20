import { photoListQuerySchema, photoPatchSchema, photoStatsQuerySchema } from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { badRequest } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { noContent, ok } from "@/core/http/response";
import { rethrow } from "@/core/http/validation";
import { adminOnly, isAdmin, requireAdmin } from "@/modules/auth";
import { photoService } from "@/modules/photo/domain/photo.service";

import { depsFrom, liveCategoryIds } from "./photo.deps";
import { listPhotosQuerySchema, photoIdParamSchema } from "./photo.schemas";
import { photoUploadHandler, photoUploadLimit } from "./photo-upload.handler";

/** Caption, category and the hidden flag as JSON. */
const MAX_PATCH_BODY = 1024;

/** Midnight UTC, when the Control panel doesn't say where the booth's day starts. */
const startOfUtcDay = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/** The Control panel's photo routes: the queue, the list, the counts, edits and removal. */
export const photoControlRoutes = new Hono<AppEnv>()
  .post("/control", adminOnly, photoUploadLimit, photoUploadHandler("control"))
  .get("/pending", zValidator("query", listPhotosQuerySchema, rethrow), async (c) => {
    await requireAdmin(c);
    return ok(c, {
      photos: await photoService.getPending(depsFrom(c), c.req.valid("query").limit),
    });
  })
  // Control panel: every photo, filtered and paged. Admin is checked before the query.
  .get("/manage", adminOnly, zValidator("query", photoListQuerySchema, rethrow), async (c) =>
    ok(
      c,
      await photoService.list(depsFrom(c), {
        ...c.req.valid("query"),
        categoryOrder: await liveCategoryIds(c),
      }),
    ),
  )
  .get("/stats", adminOnly, zValidator("query", photoStatsQuerySchema, rethrow), async (c) => {
    const { since } = c.req.valid("query");
    return ok(
      c,
      await photoService.stats(depsFrom(c), since ? new Date(since) : startOfUtcDay(new Date())),
    );
  })
  .patch(
    "/:id",
    adminOnly,
    bodyLimit({
      maxSize: MAX_PATCH_BODY,
      onError: () => {
        throw badRequest("PHOTO_PATCH_TOO_LARGE");
      },
    }),
    zValidator("param", photoIdParamSchema, rethrow),
    zValidator("json", photoPatchSchema, rethrow),
    async (c) =>
      ok(c, {
        photo: await photoService.update(
          depsFrom(c),
          c.req.valid("param").id,
          c.req.valid("json"),
          // The live list is only needed to check a category change.
          c.req.valid("json").tribe === undefined ? [] : await liveCategoryIds(c),
        ),
      }),
  )
  .post("/:id/approve", zValidator("param", photoIdParamSchema, rethrow), async (c) => {
    await requireAdmin(c);
    return ok(c, { photo: await photoService.approve(depsFrom(c), c.req.valid("param").id) });
  })
  .delete("/:id", zValidator("param", photoIdParamSchema, rethrow), async (c) => {
    await photoService.remove(depsFrom(c), {
      id: c.req.valid("param").id,
      deleteToken: c.req.header("x-delete-token"),
      isAdmin: await isAdmin(c),
    });
    return noContent(c);
  });

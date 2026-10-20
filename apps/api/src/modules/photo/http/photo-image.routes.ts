import { zValidator } from "@hono/zod-validator";
import { type Context, Hono } from "hono";

import type { AppEnv } from "@/core/http/http-context";
import { rethrow } from "@/core/http/validation";
import { photoHotlinkForbidden } from "@/modules/photo/domain/photo.errors";
import { photoService } from "@/modules/photo/domain/photo.service";
import type { ImageVariant } from "@/modules/photo/domain/photo.types";
import { isHotlinked } from "@/modules/photo/http/photo.hotlink";

import { depsFrom } from "./photo.deps";
import { imageQuerySchema, photoIdParamSchema } from "./photo.schemas";

/** The full image and the thumbnail share signing, hotlink and caching rules. */
const serveImage = async (
  c: Context<AppEnv>,
  id: string,
  signature: string | undefined,
  variant: ImageVariant,
) => {
  const hotlinked = isHotlinked(
    { referer: c.req.header("referer"), secFetchSite: c.req.header("sec-fetch-site") },
    c.get("config").ALLOWED_ORIGINS,
    new URL(c.req.url).origin,
  );
  if (hotlinked) throw photoHotlinkForbidden();

  const { object, contentType, approved } = await photoService.getImage(
    depsFrom(c),
    id,
    signature,
    variant,
  );
  return c.body(object.body, 200, {
    "content-type": contentType,
    // Vega's image loader enforces CORP, so it must allow the TV app. Hotlinking is
    // stopped by the Referer / Sec-Fetch-Site check above; nothing in it can ever run.
    "cross-origin-resource-policy": "cross-origin",
    "content-security-policy": "default-src 'none'; sandbox",
    "x-content-type-options": "nosniff",
    // Approved images never change; removal deletes the object. Pending ones stay private.
    "cache-control": approved ? "public, max-age=86400, immutable" : "private, no-store",
    etag: object.httpEtag,
  });
};

/** The full image and the thumbnail: public once approved, signed for the Control panel. */
export const photoImageRoutes = new Hono<AppEnv>()
  .get(
    "/:id/image",
    zValidator("param", photoIdParamSchema, rethrow),
    zValidator("query", imageQuerySchema, rethrow),
    async (c) => serveImage(c, c.req.valid("param").id, c.req.valid("query").sig, "image"),
  )
  .get(
    "/:id/thumb",
    zValidator("param", photoIdParamSchema, rethrow),
    zValidator("query", imageQuerySchema, rethrow),
    async (c) => serveImage(c, c.req.valid("param").id, c.req.valid("query").sig, "thumb"),
  );

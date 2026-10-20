import { type Context } from "hono";

import type { AppEnv } from "@/core/http/http-context";
import { createDb } from "@/db/client";
import type { PhotoDeps } from "@/modules/photo/domain/photo.types";
import { settingsService } from "@/modules/settings";
import { wallService } from "@/modules/wall";

// How a photo route builds what the services need from the request.

export const depsFrom = (c: Context<AppEnv>): PhotoDeps => {
  const db = createDb(c.env.DB);
  const wallId = c.get("wallId");
  return {
    db,
    wallId,
    uploadLifecycle: c.get("uploadLifecycle"),
    bucket: c.env.PHOTOS,
    wall: wallService.broadcaster(c.env.WALL, wallId),
    origin: c.get("mediaBaseUrl") ?? new URL(c.req.url).origin,
    sharedEventOrigin: c.get("sharedEventMediaBaseUrl"),
    fingerprintKey: c.get("config").CLIENT_FINGERPRINT_KEY,
    signingKey: c.get("config").ADMIN_TOKEN,
    analyses: c.get("photoWorkflow")?.analyses,
  };
};

/** The categories in the live settings, in picker order. */
export const liveCategoryIds = async (c: Context<AppEnv>) =>
  (
    await settingsService.get(createDb(c.env.DB), c.get("wallId"), c.get("settingsAuthority"))
  ).categories.map((category) => category.id);

import { wallSettingsSchema } from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import type { SettingsAuthority } from "@/contracts/runtime";
import type { AppEnv } from "@/core/http/http-context";
import { ok } from "@/core/http/response";
import { rethrow } from "@/core/http/validation";
import { createDb } from "@/db/client";
import { adminOnly } from "@/modules/auth";
import { settingsBodyTooLarge } from "@/modules/settings/domain/settings.errors";
import { settingsService } from "@/modules/settings/domain/settings.service";
import { wallService } from "@/modules/wall";

import { runtimeSettingsRouter } from "./settings-runtime.routes";

/** A handful of short strings and flags. */
const MAX_SETTINGS_BODY = 16 * 1024;

export function createSettingsRouter(authority: SettingsAuthority = "configured") {
  const router = new Hono<AppEnv>()
    .route("/runtime", runtimeSettingsRouter)
    // Public: the walls and the upload page read it.
    .get("/", async (c) => {
      const resolved = await settingsService.inspect(
        createDb(c.env.DB),
        c.get("wallId"),
        c.get("settingsAuthority"),
      );
      c.header("X-BoothWall-Settings-Authority", resolved.authority);
      return ok(c, { settings: resolved.settings });
    });
  if (authority !== "stored") return router;
  // The passcode is checked before the body is read.
  return router.put(
    "/",
    adminOnly,
    bodyLimit({
      maxSize: MAX_SETTINGS_BODY,
      onError: () => {
        throw settingsBodyTooLarge();
      },
    }),
    zValidator("json", wallSettingsSchema, rethrow),
    async (c) => {
      await c.get("validateSettings")?.({ wallId: c.get("wallId"), settings: c.req.valid("json") });
      const settings = await settingsService.save(
        {
          settingsAuthority: c.get("settingsAuthority"),
          db: createDb(c.env.DB),
          wallId: c.get("wallId"),
          wall: wallService.broadcaster(c.env.WALL, c.get("wallId")),
        },
        c.req.valid("json"),
        c.req.header("if-match"),
      );
      return ok(c, { settings });
    },
  );
}

export const settingsRouter = createSettingsRouter();

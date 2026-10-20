import { runtimeSettingsPatchSchema } from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import type { AppEnv } from "@/core/http/http-context";
import { ok } from "@/core/http/response";
import { rethrow } from "@/core/http/validation";
import { createDb } from "@/db/client";
import { adminOnly } from "@/modules/auth";
import { settingsBodyTooLarge } from "@/modules/settings/domain/settings.errors";
import { settingsService } from "@/modules/settings/domain/settings.service";
import { wallService } from "@/modules/wall";

export const runtimeSettingsRouter = new Hono<AppEnv>().patch(
  "/",
  adminOnly,
  bodyLimit({
    maxSize: 1024,
    onError: () => {
      throw settingsBodyTooLarge();
    },
  }),
  zValidator("json", runtimeSettingsPatchSchema, rethrow),
  async (c) =>
    ok(c, {
      settings: await settingsService.setRuntimeState(
        {
          settingsAuthority: c.get("settingsAuthority"),
          db: createDb(c.env.DB),
          wallId: c.get("wallId"),
          wall: wallService.broadcaster(c.env.WALL, c.get("wallId")),
        },
        c.req.valid("json"),
      ),
    }),
);

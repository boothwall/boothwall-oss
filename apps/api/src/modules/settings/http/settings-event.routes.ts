import { type Context, Hono } from "hono";

import type { AppEnv } from "@/core/http/http-context";
import { ok } from "@/core/http/response";
import { createDb } from "@/db/client";
import { adminOnly } from "@/modules/auth";
import { settingsService } from "@/modules/settings/domain/settings.service";
import type { SettingsDeps } from "@/modules/settings/domain/settings.types";
import { wallService } from "@/modules/wall";

const depsFrom = (c: Context<AppEnv>): SettingsDeps => ({
  settingsAuthority: c.get("settingsAuthority"),
  db: createDb(c.env.DB),
  wallId: c.get("wallId"),
  wall: wallService.broadcaster(c.env.WALL, c.get("wallId")),
});

/** The end of the event (EVENT_PATHS in @boothwall/shared): the walls switch to the recap QR. */
export const eventRouter = new Hono<AppEnv>()
  .post("/end", adminOnly, async (c) =>
    ok(c, { settings: await settingsService.setEventEnded(depsFrom(c), true) }),
  )
  .post("/reopen", adminOnly, async (c) =>
    ok(c, { settings: await settingsService.setEventEnded(depsFrom(c), false) }),
  );

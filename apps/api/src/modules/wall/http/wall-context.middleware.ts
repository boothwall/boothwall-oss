import { DEFAULT_WALL_ID, type WallId, wallIdSchema } from "@boothwall/shared";
import type { Context, MiddlewareHandler } from "hono";

import type { AppEnv } from "@/core/http/http-context";

/**
 * Decides which wall a request is for. This is the extension point for serving more than one
 * wall: an embedding host passes its own resolver to `createApp` (from a subdomain, say) and
 * everything downstream (photo queries, the settings row, the realtime room) follows it.
 * It may throw a `ServiceError` for an unknown wall.
 */
export type WallResolver = (c: Context<AppEnv>) => WallId | Promise<WallId>;

/** A self-hosted BoothWall has exactly one wall. */
export const defaultWallResolver: WallResolver = () => DEFAULT_WALL_ID;

/** Resolves the wall once per request and stores it as `c.get("wallId")`. */
export const wallContext =
  (resolve: WallResolver = defaultWallResolver): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    c.set("wallId", wallIdSchema.parse(await resolve(c)));
    await next();
  };

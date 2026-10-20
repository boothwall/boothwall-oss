import { Hono } from "hono";

import type { AppEnv } from "@/core/http/http-context";

import { photoControlRoutes } from "./photo-control.routes";
import { photoImageRoutes } from "./photo-image.routes";
import { photoWallRoutes } from "./photo-wall.routes";

/**
 * Everything under /photos. No two parts share a method and path, so the order they are
 * mounted in doesn't matter.
 */
export const photoRouter = new Hono<AppEnv>()
  .route("/", photoWallRoutes)
  .route("/", photoControlRoutes)
  .route("/", photoImageRoutes);

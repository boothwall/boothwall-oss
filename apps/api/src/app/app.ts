import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { readConfig } from "@/config/env";
import type {
  PhotoWorkflow,
  SettingsAuthority,
  SettingsValidator,
  UploadLifecycle,
} from "@/contracts/runtime";
import { handleApiError } from "@/core/http/handle-api-error";
import type { AppEnv } from "@/core/http/http-context";
import { errorBody, ok } from "@/core/http/response";
import { isAllowedOrigin } from "@/core/security/allowed-origin";
import { photoRouter } from "@/modules/photo";
import { reactionRouter } from "@/modules/reaction";
import { createSettingsRouter, eventRouter } from "@/modules/settings";
import { wallContext, type WallResolver, wallRouter } from "@/modules/wall";

export type AppOptions = {
  /** Standalone presentation comes from configuration. An embedding host can opt into stored edits. */
  settingsAuthority?: SettingsAuthority;
  /** Canonical media base shared by all realtime subscribers, independent of HTTP surface. */
  sharedEventMediaBaseUrl?: (context: Context<AppEnv>) => string | undefined;
  /** Host-owned URL base for media DTOs; may include a browser API path prefix. */
  mediaBaseUrl?: (context: Context<AppEnv>) => string | undefined;
  /** Trusted host authorization epoch, never read from client headers. */
  roomGeneration?: (context: Context<AppEnv>) => number | undefined;
  validateSettings?: (context: Context<AppEnv>) => SettingsValidator | undefined;
  /** Which wall a request is for. Defaults to the single wall of a self-hosted BoothWall. */
  resolveWall?: WallResolver;
  photoWorkflow?: (context: Context<AppEnv>) => PhotoWorkflow | undefined;
  uploadLifecycle?: (context: Context<AppEnv>) => UploadLifecycle | undefined;
};

/** Builds the API. An embedding host can pass its own `resolveWall`. */
export const createApp = ({
  settingsAuthority = "configured",
  mediaBaseUrl,
  sharedEventMediaBaseUrl,
  resolveWall,
  uploadLifecycle,
  photoWorkflow,
  validateSettings,
  roomGeneration,
}: AppOptions = {}) => {
  const api = new Hono<AppEnv>()
    .use(requestId())
    // CORP is left to each route: the TV's native image loader enforces it like a browser.
    .use(secureHeaders({ crossOriginResourcePolicy: false }))
    .use(async (c, next) => {
      c.set("config", readConfig(c.env));
      await next();
    })
    .use((c, next) =>
      cors({
        origin: (origin) =>
          isAllowedOrigin(origin, c.get("config").ALLOWED_ORIGINS) ? origin : null,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowHeaders: [
          "authorization",
          "content-type",
          "x-delete-token",
          "if-match",
          "idempotency-key",
        ],
      })(c, next),
    )
    .get("/health", (c) => ok(c, { status: "ok" }))
    .use(wallContext(resolveWall))
    .use(async (c, next) => {
      c.set("settingsAuthority", settingsAuthority);
      c.set("mediaBaseUrl", mediaBaseUrl?.(c));
      c.set("sharedEventMediaBaseUrl", sharedEventMediaBaseUrl?.(c));
      c.set("uploadLifecycle", uploadLifecycle?.(c));
      c.set("photoWorkflow", photoWorkflow?.(c));
      c.set("roomGeneration", roomGeneration?.(c));
      c.set("validateSettings", validateSettings?.(c));
      await next();
    })
    .route("/photos", reactionRouter)
    .route("/photos", photoRouter)
    .route("/wall", wallRouter)
    .route("/settings", createSettingsRouter(settingsAuthority));

  if (settingsAuthority === "stored") api.route("/event", eventRouter);

  api.onError(handleApiError);

  api.notFound((c) => c.json(errorBody("ROUTE_NOT_FOUND", "common.routeNotFound"), 404));
  return api;
};

/** The self-hosted API: one wall. */
export const app = createApp();

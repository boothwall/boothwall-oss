import { type ControlPhotoDTO } from "@boothwall/shared";
import { Hono } from "hono";
import { afterEach, beforeEach, vi } from "vitest";

import { readConfig } from "@/config/env";
import { handleApiError } from "@/core/http/handle-api-error";
import type { AppEnv } from "@/core/http/http-context";
import type { AppBindings } from "@/core/runtime/bindings";
import { authFailureRepo } from "@/modules/auth/data/auth-failure.repo";
import { settingsRepo } from "@/modules/settings/data/settings.repo";

import { photoRouter } from "./photo.routes";

// Route-level fixture. Whole-app behavior is covered by app integration tests.
const app = new Hono<AppEnv>()
  .use(async (c, next) => {
    c.set("config", readConfig(c.env));
    c.set("wallId", "default");
    await next();
  })
  .route("/photos", photoRouter)
  .onError(handleApiError);

export const PASSCODE = "test-passcode";
export const ID = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d001";
export const TRIBE = "fire-tv";

export const env = {
  DB: {},
  PHOTOS: {},
  WALL: {},
  ADMIN_TOKEN: PASSCODE,
  CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
  ALLOWED_ORIGINS: "https://booth.test",
  RETENTION_DAYS: "30",
} as unknown as AppBindings;

export const photo: ControlPhotoDTO = {
  id: ID,
  status: "hidden",
  caption: null,
  tribe: TRIBE,
  imageUrl: `https://api.test/photos/${ID}/image?sig=${"a".repeat(32)}`,
  thumbUrl: `https://api.test/photos/${ID}/thumb?sig=${"a".repeat(32)}`,
  createdAt: "2026-10-07T12:00:00.000Z",
  analysis: null,
};

export const request = (path: string, init: RequestInit & { passcode?: string } = {}) => {
  const { passcode = PASSCODE, headers, ...rest } = init;
  return app.request(
    path,
    {
      ...rest,
      headers: { ...(passcode && { authorization: `Bearer ${passcode}` }), ...headers },
    },
    env,
  );
};

export const patch = (body: unknown, passcode?: string) =>
  request(`/photos/${ID}`, {
    method: "PATCH",
    passcode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

export const errorCode = async (res: Response) =>
  ((await res.json()) as { error: { code: string } }).error.code;

export const failures = () => vi.mocked(authFailureRepo.countSince);

/** No saved settings (the config's categories are live) and no failed passcodes. */
export const mockRouteDefaults = () => {
  beforeEach(() => {
    vi.spyOn(settingsRepo, "get").mockResolvedValue(null);
    vi.spyOn(authFailureRepo, "countSince").mockResolvedValue(0);
    vi.spyOn(authFailureRepo, "add").mockResolvedValue();
  });
  afterEach(() => vi.restoreAllMocks());
};

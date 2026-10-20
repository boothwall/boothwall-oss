import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";
import { Hono } from "hono";
import { afterEach, expect, it, vi } from "vitest";

import { readConfig } from "@/config/env";
import type { PhotoWorkflow } from "@/contracts/runtime";
import { handleApiError } from "@/core/http/handle-api-error";
import type { AppEnv } from "@/core/http/http-context";
import { photoService } from "@/modules/photo/domain/photo.service";
import { settingsService } from "@/modules/settings";

import { env, ID } from "./photo.routes.fixtures";
import { photoWallRoutes } from "./photo-wall.routes";

const photo: PhotoDTO = {
  id: ID,
  status: "pending",
  caption: null,
  tribe: "fire-tv",
  imageUrl: "https://api.test/image",
  thumbUrl: "https://api.test/thumb",
  createdAt: "2026-10-13T10:00:00.000Z",
};

const request = async (workflow?: PhotoWorkflow) => {
  const pending: Promise<unknown>[] = [];
  const app = new Hono<AppEnv>()
    .use(async (c, next) => {
      c.set("config", readConfig(c.env));
      c.set("wallId", "default");
      c.set("photoWorkflow", workflow);
      await next();
    })
    .route("/photos", photoWallRoutes)
    .onError(handleApiError);
  const body = new FormData();
  body.set("image", new File(["image"], "image.jpg", { type: "image/jpeg" }));
  body.set("tribe", "fire-tv");
  body.set("consent", "true");
  const response = await app.request("/photos", { method: "POST", body }, env, {
    waitUntil: (promise: Promise<unknown>) => {
      pending.push(promise);
    },
  } as ExecutionContext);
  await Promise.all(pending);
  return response;
};

afterEach(() => vi.restoreAllMocks());

it("refuses legacy review settings without a host workflow and gives operator guidance", async () => {
  vi.spyOn(settingsService, "get").mockResolvedValue({
    ...DEFAULT_SETTINGS,
    autoApprove: true,
    smartModeration: { ...DEFAULT_SETTINGS.smartModeration, enabled: true },
  });
  const upload = vi
    .spyOn(photoService, "upload")
    .mockResolvedValue({ photo, deleteToken: "token" });
  const response = await request();
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({
    error: {
      code: "PHOTO_REVIEW_UNAVAILABLE",
      details: { setting: "smartModeration.enabled", requiredValue: false },
    },
  });
  expect(upload).not.toHaveBeenCalled();
});

it("returns the persisted upload even when its host observation rejects", async () => {
  vi.spyOn(settingsService, "get").mockResolvedValue(DEFAULT_SETTINGS);
  vi.spyOn(photoService, "upload").mockResolvedValue({ photo, deleteToken: "token" });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const observe = vi.fn(async () => {
    throw new Error("observer unavailable");
  });
  const response = await request({ planUpload: () => ({ approveNow: false, observe }) });
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ photo, deleteToken: "token" });
  expect(observe).toHaveBeenCalledWith({ photo, thumb: undefined });
});

it("never schedules host observation for a successfully replayed upload", async () => {
  vi.spyOn(settingsService, "get").mockResolvedValue(DEFAULT_SETTINGS);
  vi.spyOn(photoService, "upload").mockResolvedValue({
    photo,
    deleteToken: "token",
    replayed: true,
  });
  const observe = vi.fn(async () => {});
  expect((await request({ planUpload: () => ({ approveNow: false, observe }) })).status).toBe(201);
  expect(observe).not.toHaveBeenCalled();
});

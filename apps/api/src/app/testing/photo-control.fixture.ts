import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { DEFAULT_SETTINGS } from "@boothwall/shared";

import { createApp } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { jpeg } from "@/testing/photo-image.fixtures";
import { sqliteD1 } from "@/testing/sqlite-d1.fixture";

export async function photoControlFixture() {
  const sqlite = new DatabaseSync(":memory:");
  const migrations = fileURLToPath(new NodeURL("../../../migrations/", import.meta.url));
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    sqlite.exec(
      readFileSync(`${migrations}/${name}`, "utf8").replaceAll("--> statement-breakpoint", ""),
    );
  const objects = new Map<string, ArrayBuffer>();
  const events: unknown[] = [];
  const env = {
    DB: sqliteD1(sqlite),
    PHOTOS: {
      put: async (key: string, bytes: ArrayBuffer) => {
        objects.set(key, bytes.slice(0));
      },
      delete: async (key: string) => {
        objects.delete(key);
      },
    },
    WALL: {
      idFromName: (name: string) => name,
      get: () => ({
        broadcast: async (value: string) => {
          events.push(JSON.parse(value));
        },
      }),
    },
    ADMIN_TOKEN: "fixture-admin-control-0123456789",
    CLIENT_FINGERPRINT_KEY: "fixture-fingerprint-key-0123456789",
    ALLOWED_ORIGINS: "https://client.test",
    RETENTION_DAYS: "30",
  } as unknown as AppBindings;
  const app = createApp({
    settingsAuthority: "stored",
    resolveWall: (c) => new URL(c.req.url).searchParams.get("wall") ?? "wall-a",
  });
  const request = (path: string, init: RequestInit = {}, admin = true) =>
    app.request(
      `https://api.test${path}`,
      {
        ...init,
        headers: {
          origin: "https://client.test",
          "cf-connecting-ip": "198.51.100.8",
          ...(admin ? { authorization: `Bearer ${env.ADMIN_TOKEN}` } : {}),
          ...init.headers,
        },
      },
      env,
    );
  const settings = {
    ...DEFAULT_SETTINGS,
    autoApprove: false,
    smartModeration: { ...DEFAULT_SETTINGS.smartModeration, enabled: false },
    uploadsOpen: true,
  };
  for (const wall of ["wall-a", "wall-b"])
    await request(`/settings?wall=${wall}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
  const send = (control: boolean, wall = "wall-a", extra: Record<string, string> = {}) => {
    const body = new FormData();
    body.set("image", jpeg());
    body.set("tribe", settings.categories[0]!.id);
    body.set("consent", "true");
    for (const [key, value] of Object.entries(extra)) body.set(key, value);
    return request(
      `/photos${control ? "/control" : ""}?wall=${wall}`,
      { method: "POST", body, headers: { "idempotency-key": crypto.randomUUID() } },
      control,
    );
  };
  return { sqlite, objects, events, settings, request, send, close: () => sqlite.close() };
}

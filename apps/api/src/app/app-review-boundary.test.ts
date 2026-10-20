import { expect, it } from "vitest";

import type { AppBindings } from "@/contracts/runtime";

import { createApp } from "./app";

it("does not mount the legacy provider status route in the standalone application", async () => {
  const env = {
    ADMIN_TOKEN: "test-passcode",
    CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
    ALLOWED_ORIGINS: "https://wall.test",
    RETENTION_DAYS: "30",
  } as AppBindings;
  const response = await createApp().request(
    "/moderation/status",
    {
      headers: { authorization: "Bearer test-passcode" },
    },
    env,
  );
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ error: { code: "ROUTE_NOT_FOUND" } });
});

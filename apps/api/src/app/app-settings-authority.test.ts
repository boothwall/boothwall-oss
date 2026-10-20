import { DEFAULT_SETTINGS } from "@boothwall/shared";
import { afterEach, expect, it, vi } from "vitest";

import type { AppBindings } from "@/contracts/runtime";
import { adminGuardService } from "@/modules/auth";
import { settingsRepo } from "@/modules/settings/data/settings.repo";
import { wallService } from "@/modules/wall";

import { createApp } from "./app";

afterEach(() => vi.restoreAllMocks());

it("does not expose standalone presentation, review-policy or event-lifecycle mutations", async () => {
  vi.spyOn(adminGuardService, "verify").mockResolvedValue(true);
  vi.spyOn(settingsRepo, "get").mockResolvedValue(null);
  const write = vi.spyOn(settingsRepo, "compareAndPut").mockResolvedValue(true);
  const broadcast = vi.fn();
  vi.spyOn(wallService, "broadcaster").mockReturnValue({ broadcast });
  const env = {
    DB: {},
    WALL: {},
    ADMIN_TOKEN: "test-passcode",
    CLIENT_FINGERPRINT_KEY: "fixture-only-client-fingerprint-key-32",
    ALLOWED_ORIGINS: "https://wall.test",
    RETENTION_DAYS: "30",
  } as unknown as AppBindings;
  for (const [path, method] of [
    ["/settings", "PUT"],
    ["/event/end", "POST"],
    ["/event/reopen", "POST"],
  ]) {
    const response = await createApp().request(
      path!,
      {
        method,
        headers: { authorization: "Bearer test-passcode", "content-type": "application/json" },
        body: JSON.stringify({
          ...DEFAULT_SETTINGS,
          announcement: "Live edit",
          smartModeration: {
            ...DEFAULT_SETTINGS.smartModeration,
            enabled: true,
            autoApproveSafe: true,
          },
        }),
      },
      env,
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "ROUTE_NOT_FOUND" } });
  }
  expect(write).not.toHaveBeenCalled();
  expect(broadcast).not.toHaveBeenCalled();
});

import { DEFAULT_SETTINGS } from "@boothwall/shared";
import { expect, it, vi } from "vitest";

import type { EventTransport } from "#runtime";

import { createSettingsClient } from "./settings.client";

it("reads publicly and saves the complete settings through its captured control transport", async () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    eventName: "Together",
    secondsPerPhoto: 3,
    captionStyle: "typewriter" as const,
  };
  const request = vi.fn().mockResolvedValue(Response.json({ settings }));
  const client = createSettingsClient({ request, socketUrl: () => "" } satisfies EventTransport);
  expect(await client.fetchSettings()).toEqual(settings);
  request.mockResolvedValue(Response.json({ settings }));
  expect(await client.saveSettings(settings)).toEqual(settings);
  expect(request.mock.calls).toEqual([
    ["/settings", { access: "public" }],
    [
      "/settings",
      expect.objectContaining({ access: "control", method: "PUT", body: JSON.stringify(settings) }),
    ],
  ]);
});
it("rejects malformed settings instead of exposing defaults as a successful save", async () => {
  const request = vi.fn().mockResolvedValue(Response.json({ settings: { secondsPerPhoto: 2 } }));
  await expect(
    createSettingsClient({ request, socketUrl: () => "" }).fetchSettings(),
  ).rejects.toThrow();
});

it("sends only explicit runtime changes through control access", async () => {
  const settings = { ...DEFAULT_SETTINGS, playbackPaused: true };
  const request = vi.fn().mockResolvedValue(Response.json({ settings }));
  const client = createSettingsClient({ request, socketUrl: () => "" });
  expect(await client.saveRuntimeState({ playbackPaused: true })).toEqual(settings);
  expect(request).toHaveBeenCalledWith("/settings/runtime", {
    access: "control",
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playbackPaused: true }),
  });
});

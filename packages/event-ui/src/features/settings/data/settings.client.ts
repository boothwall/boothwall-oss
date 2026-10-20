import {
  EVENT_PATHS,
  RUNTIME_SETTINGS_PATH,
  type RuntimeSettingsPatch,
  runtimeSettingsPatchSchema,
  settingsResponseSchema,
  settingsVersion,
  type WallSettings,
} from "@boothwall/shared";

import type { EventTransport } from "#runtime";

export function createSettingsClient(transport: EventTransport) {
  const read = async (response: Response) =>
    settingsResponseSchema.parse(await response.json()).settings;
  return {
    async fetchSettings(): Promise<WallSettings> {
      return read(await transport.request("/settings", { access: "public" }));
    },
    async saveSettings(settings: WallSettings, base?: WallSettings): Promise<WallSettings> {
      return read(
        await transport.request("/settings", {
          access: "control",
          method: "PUT",
          headers: {
            "content-type": "application/json",
            ...(base ? { "if-match": await settingsVersion(base) } : {}),
          },
          body: JSON.stringify(settings),
        }),
      );
    },
    async saveRuntimeState(patch: RuntimeSettingsPatch): Promise<WallSettings> {
      return read(
        await transport.request(RUNTIME_SETTINGS_PATH, {
          access: "control",
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(runtimeSettingsPatchSchema.parse(patch)),
        }),
      );
    },
    async setEventEnded(ended: boolean): Promise<WallSettings> {
      return read(
        await transport.request(ended ? EVENT_PATHS.end : EVENT_PATHS.reopen, {
          access: "control",
          method: "POST",
        }),
      );
    },
  };
}

import { type WallSettings, wallSettingsSchema } from "../wall-settings/wall-settings.schemas.ts";

/** Exact, ASCII-safe content version for If-Match; settings contain no credentials. */
export function settingsVersion(settings: WallSettings): string {
  return `"${encodeURIComponent(JSON.stringify(wallSettingsSchema.parse(settings)))}"`;
}

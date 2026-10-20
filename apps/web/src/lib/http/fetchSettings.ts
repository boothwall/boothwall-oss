import { settingsResponseSchema, type WallSettings } from "@boothwall/shared";

import { apiFetch } from "@/lib/http/api";

/** The wall's live settings, as anyone can read them: no passcode needed. */
export async function fetchSettings(): Promise<WallSettings> {
  const res = await apiFetch("/settings");
  return settingsResponseSchema.parse(await res.json()).settings;
}

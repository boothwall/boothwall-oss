import { z } from "zod";

import { DEFAULT_SETTINGS } from "#config";
import { wallSettingsSchema } from "#settings";

/**
 * Settings as a screen receives them. A field an older API doesn't send yet takes the
 * config's value, so a TV or browser can be updated before its API without going blank.
 * Saving still checks the full schema (`wallSettingsSchema`).
 */
export const receivedSettingsSchema = z.preprocess(
  (value) =>
    value !== null && typeof value === "object" ? { ...DEFAULT_SETTINGS, ...value } : value,
  wallSettingsSchema,
);

/** The body of `GET /settings` and `PUT /settings`. */
export const settingsResponseSchema = z.object({ settings: receivedSettingsSchema });

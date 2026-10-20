import { badRequest, ServiceError } from "@/core/http/errors";

export const SETTINGS_BODY_TOO_LARGE = "SETTINGS_BODY_TOO_LARGE" as const;

export const settingsBodyTooLarge = () =>
  badRequest(SETTINGS_BODY_TOO_LARGE, undefined, "settings.bodyTooLarge");

export const settingsConflict = () =>
  new ServiceError(409, "SETTINGS_CONFLICT", "settings.conflict");

export const settingsStateInvalid = () =>
  new ServiceError(409, "SETTINGS_MIGRATION_REQUIRED", "settings.conflict");

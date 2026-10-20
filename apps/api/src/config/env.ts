import { z } from "zod";

import type { AppBindings } from "@/contracts/runtime";

const configSchema = z.object({
  CLIENT_FINGERPRINT_KEY: z.string().min(32).optional(),
  ADMIN_TOKEN: z.string().min(6, "ADMIN_TOKEN must be at least 6 characters"),
  ALLOWED_ORIGINS: z.string().transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
  RETENTION_DAYS: z.coerce.number().int().positive(),
});

export type AppConfig = z.infer<typeof configSchema>;

export function readConfig(env: AppBindings): AppConfig {
  return configSchema.parse(env);
}

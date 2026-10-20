import { z } from "zod";

/** Persisted flags are complete; missing fields must not inherit compatibility defaults. */
export const wallRuntimeStateSchema = z.strictObject({
  playbackPaused: z.boolean(),
  uploadsOpen: z.boolean(),
  eventEnded: z.boolean(),
});

const digest = z.string().regex(/^[a-f0-9]{64}$/);

/** Original bytes and identities are retained unchanged by every runtime command. */
export const settingsMigrationReceiptSchema = z.strictObject({
  originalStored: z.string(),
  storedSha256: digest,
  configuredSha256: digest,
  targetConfiguredSha256: digest,
  decisions: z.strictObject({ retainEnded: z.boolean(), disableLegacyReview: z.boolean() }),
});

export const configuredRuntimeRecordSchema = z.strictObject({
  kind: z.literal("configured-runtime"),
  schemaVersion: z.literal(1),
  runtimeState: wallRuntimeStateSchema,
  migration: settingsMigrationReceiptSchema.optional(),
});

export type ConfiguredRuntimeRecord = z.infer<typeof configuredRuntimeRecordSchema>;

import { z } from "zod";

import { wallSettingsSchema } from "#settings";

const httpUrl = z.url().refine((value) => /^https?:\/\//.test(value), "Expected an HTTP URL");
/** Metadata returned by a host after resolving and authorizing a display target. */
export const wallConnectionMetadataSchema = z.object({
  apiBaseUrl: httpUrl,
  joinUrl: httpUrl,
  recapUrl: httpUrl.optional(),
  sourceUrl: httpUrl,
  sourceLabel: z.string(),
  showSource: z.boolean(),
  badge: z.string().optional(),
  venue: z.string().optional(),
  storageNamespace: z.string().min(1),
  initialSettings: wallSettingsSchema,
});

import { z } from "zod";

import { tribeSchema } from "#settings";

import { reactionCountsSchema } from "../reactions/reactions.schemas.ts";
import { receivedSettingsSchema } from "../received-settings/received-settings.schemas.ts";

/** Upload limits shared by the phone (pre-check) and the API (enforced). */
export const PHOTO_LIMITS = {
  captionMaxLength: 60,
  maxBytes: 3 * 1024 * 1024,
  maxEdgePx: 1080,
  /** Wall cards decode this small copy; the full image is kept for the spotlight. */
  thumbEdgePx: 480,
  thumbMaxBytes: 256 * 1024,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const captionSchema = z
  .string()
  .trim()
  .max(PHOTO_LIMITS.captionMaxLength)
  .transform((value) => value || null);

/**
 * Uploads wait as "pending" until the booth approves them for the wall. "hidden" takes a photo
 * off the wall without deleting it; like a pending one, it is private.
 */
export const photoStatusSchema = z.enum(["pending", "approved", "hidden"]);

export type PhotoStatus = z.infer<typeof photoStatusSchema>;

/** Public view of a photo. */
export const photoSchema = z.object({
  id: z.string().min(1),
  status: photoStatusSchema,
  caption: z.string().nullable(),
  tribe: tribeSchema,
  imageUrl: z.string().min(1),
  /** Small copy for wall-size cards; the full image URL for photos stored without one. */
  thumbUrl: z.string().min(1),
  createdAt: z.iso.datetime(),
  /** A recorded server deadline; null means unresolved history, omitted by older APIs. */
  expiresAt: z.iso.datetime().nullable().optional(),
  /** Reaction taps from the phone feed. Optional so older APIs and clients still match. */
  reactions: reactionCountsSchema.optional(),
  /**
   * 0 to 1: how well the smart check thinks the photo carries the big screen, for the wall's
   * "AI pick". Left out for photos that weren't checked, and by APIs without smart moderation.
   */
  highlight: z.number().min(0).max(1).optional(),
});

export type PhotoDTO = z.infer<typeof photoSchema>;

export const wallStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  byTribe: z.record(tribeSchema, z.number().int().nonnegative()),
});

export type WallStatsDTO = z.infer<typeof wallStatsSchema>;

export const wallSnapshotSchema = z.object({
  photos: z.array(photoSchema),
  stats: wallStatsSchema,
  settings: receivedSettingsSchema,
});

export type WallSnapshotDTO = z.infer<typeof wallSnapshotSchema>;

export const uploadResultSchema = z.object({
  photo: photoSchema,
  /** Secret the uploader keeps to delete their own photo later. */
  deleteToken: z.string().min(1),
});

export type UploadResultDTO = z.infer<typeof uploadResultSchema>;

/**
 * What the guest who sent a photo may learn about it, with its delete token: still waiting,
 * on the wall, or declined (removed, hidden or gone). Nothing else about the photo is shared.
 */
export const guestPhotoStateSchema = z.enum(["waiting", "live", "declined"]);

export type GuestPhotoState = z.infer<typeof guestPhotoStateSchema>;

export const guestPhotoStatusSchema = z.object({ state: guestPhotoStateSchema });

export type GuestPhotoStatusDTO = z.infer<typeof guestPhotoStatusSchema>;

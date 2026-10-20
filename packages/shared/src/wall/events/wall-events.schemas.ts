import { z } from "zod";

import { photoSchema, wallStatsSchema } from "../photo/photo.schemas.ts";
import { reactionCountsSchema } from "../reactions/reactions.schemas.ts";
import { receivedSettingsSchema } from "../received-settings/received-settings.schemas.ts";

/** Buttons the phone remote can press on every connected wall. */
export const remoteCommandSchema = z.enum(["left", "right", "select", "back", "playpause"]);

export type RemoteCommand = z.infer<typeof remoteCommandSchema>;

/**
 * Requests for the screen's host rather than its wall: a photo call, the remote's help, or the
 * next built-in theme until the screen restarts.
 */
export const hostMessageSchema = z.enum(["photocall", "hints", "theme"]);

export type HostMessage = z.infer<typeof hostMessageSchema>;

/** What the phone remote sends: a button, or a host message that only a TV app offering it acts on. */
export const remoteMessageSchema = z.enum([
  ...remoteCommandSchema.options,
  ...hostMessageSchema.options,
]);

export type RemoteMessage = z.infer<typeof remoteMessageSchema>;

/** Messages pushed to every connected wall over the realtime socket. */
export const wallEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("wall.access-changed"), permanent: z.boolean() }),
  z.object({ type: z.literal("photo.created"), photo: photoSchema, stats: wallStatsSchema }),
  z.object({ type: z.literal("photo.removed"), photoId: z.string(), stats: wallStatsSchema }),
  /** A photo on the wall got a new caption or category; it keeps its place. */
  z.object({ type: z.literal("photo.updated"), photo: photoSchema, stats: wallStatsSchema }),
  /**
   * A photo's reaction counts changed. Batched: at most one per photo every couple of
   * seconds, carrying the latest totals (not the taps since the last event).
   */
  z.object({
    type: z.literal("photo.reactions"),
    photoId: z.string(),
    counts: reactionCountsSchema,
  }),
  z.object({ type: z.literal("remote.command"), command: remoteMessageSchema }),
  /** Someone saved settings in the Control panel. */
  z.object({ type: z.literal("settings.updated"), settings: receivedSettingsSchema }),
]);

export type WallEvent = z.infer<typeof wallEventSchema>;

/** Events that add, change or remove photos on the wall. */
export type WallPhotoEvent = Exclude<
  WallEvent,
  | { type: "wall.access-changed" }
  | { type: "remote.command" }
  | { type: "settings.updated" }
  | { type: "photo.reactions" }
>;

import { z } from "zod";

/** Emoji guests can tap on a photo in the phone feed; the wall decides how to draw them. */
export const REACTIONS = ["heart", "fire", "laugh", "clap"] as const;

export const reactionSchema = z.enum(REACTIONS);

export type Reaction = z.infer<typeof reactionSchema>;

/** How every screen draws each reaction: the phone feed's buttons and the wall's floats. */
export const REACTION_EMOJI: Record<Reaction, string> = {
  heart: "❤️",
  fire: "🔥",
  laugh: "😂",
  clap: "👏",
};

/** Taps per reaction on one photo. Every reaction is present, zero if nobody tapped it. */
export const reactionCountsSchema = z.record(reactionSchema, z.number().int().nonnegative());

export type ReactionCounts = z.infer<typeof reactionCountsSchema>;

/** Body of POST /photos/:id/reactions. */
export const reactionBodySchema = z.object({ reaction: reactionSchema });

export type ReactionBody = z.infer<typeof reactionBodySchema>;

/** Response of POST /photos/:id/reactions: the photo's counts after the tap. */
export const reactionResultSchema = z.object({
  photoId: z.string().min(1),
  counts: reactionCountsSchema,
});

export type ReactionResultDTO = z.infer<typeof reactionResultSchema>;

/** All zero, for photos nobody has reacted to yet. */
export const emptyReactionCounts = (): ReactionCounts =>
  Object.fromEntries(REACTIONS.map((reaction) => [reaction, 0])) as ReactionCounts;

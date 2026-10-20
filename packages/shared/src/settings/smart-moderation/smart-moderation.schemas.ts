import { z } from "zod";

/** Legacy saved review policy, retained so older settings remain readable. */
export const smartModerationSchema = z.object({
  /** Requires a host-provided review workflow; unsupported standalone settings refuse uploads. */
  enabled: z.boolean(),
  /** Approve photos waiting in the queue once the check finds nothing. */
  autoApproveSafe: z.boolean(),
  /** When uploads skip the queue, wait for the check and keep flagged photos in the queue. */
  holdFlagged: z.boolean(),
});

export type SmartModeration = z.infer<typeof smartModerationSchema>;

export const DEFAULT_SMART_MODERATION: SmartModeration = {
  enabled: false,
  autoApproveSafe: false,
  holdFlagged: true,
};

/** Optional host review capability response; standalone does not mount a status route. */
export const moderationStatusSchema = z.object({ available: z.boolean() });

export type ModerationStatusDTO = z.infer<typeof moderationStatusSchema>;

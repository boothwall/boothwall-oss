import type { ReactionResultDTO } from "@boothwall/shared";

import { clientFingerprints } from "@/core/security/client-ip";
import { reactionRepo } from "@/modules/reaction/data/reaction.repo";

import { parseReactionCounts } from "./reaction.counts";
import { reactionPhotoNotFound, reactionRateLimited } from "./reaction.errors";
import type { ReactArgs, ReactionDeps } from "./reaction.types";

/**
 * Taps per client (a purpose-separated daily HMAC, like uploads). Generous, because a whole venue can
 * share one IP: it only stops scripts. The phone should still debounce a held finger.
 */
export const REACTION_LIMITS = { max: 600, windowMs: 60 * 1000 };

export const reactionService = {
  /**
   * One tap: checked against the limit, counted in D1, then handed to the room, which
   * pushes the photo's totals at most once per batch window.
   */
  async react(
    deps: ReactionDeps,
    { photoId, reaction, clientIp }: ReactArgs,
  ): Promise<ReactionResultDTO> {
    const now = deps.now?.() ?? new Date();
    const clientHash = await clientFingerprints(clientIp, now, deps.fingerprintKey, "reaction");
    if (!(await deps.room.allow(clientHash, REACTION_LIMITS))) {
      throw reactionRateLimited({ retryAfterSeconds: REACTION_LIMITS.windowMs / 1000 });
    }

    const stored = await reactionRepo.increment(deps.db, deps.wallId, photoId, reaction);
    if (stored === null) throw reactionPhotoNotFound({ id: photoId });
    const counts = parseReactionCounts(stored);

    // The tap is saved either way; screens catch up with their next snapshot.
    try {
      await deps.room.queue(photoId, counts);
    } catch (err) {
      console.error("photo.reactions queue failed", err);
    }
    return { photoId, counts };
  },
};

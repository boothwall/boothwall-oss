import { notFound, tooManyRequests } from "@/core/http/errors";

export const REACTION_PHOTO_NOT_FOUND = "REACTION_PHOTO_NOT_FOUND" as const;
export const REACTION_RATE_LIMITED = "REACTION_RATE_LIMITED" as const;

/** No such photo on this wall, or it isn't approved (pending and hidden ones are private). */
export const reactionPhotoNotFound = (details: { id: string }) =>
  notFound(REACTION_PHOTO_NOT_FOUND, details, "photo.notFound");

export const reactionRateLimited = (details: { retryAfterSeconds: number }) =>
  tooManyRequests(REACTION_RATE_LIMITED, details, "reaction.rateLimited");

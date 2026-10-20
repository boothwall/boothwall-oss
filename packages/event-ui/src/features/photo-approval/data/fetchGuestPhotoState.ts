import { type GuestPhotoState, guestPhotoStatusSchema } from "@boothwall/shared";

import { EventApiError, type EventTransport } from "#runtime";

/** Worth asking again: the network, a busy wall or a server hiccup. */
const passing = (error: unknown) =>
  !(error instanceof EventApiError) ||
  error.status === 408 ||
  error.status === 429 ||
  error.status >= 500;

/**
 * How the guest's own photo is doing, asked with its delete token; a photo that is gone counts
 * as declined. Null when this host can't say (no such route, or it refuses the token), so the
 * caller goes back to watching the wall. A passing failure throws, for the next poll to retry.
 */
export async function fetchGuestPhotoState(
  transport: EventTransport,
  photoId: string,
  deleteToken: string,
): Promise<GuestPhotoState | null> {
  try {
    const response = await transport.request(`/photos/${encodeURIComponent(photoId)}/status`, {
      access: "public",
      headers: { "x-delete-token": deleteToken },
    });
    const body: unknown = await response.json().catch(() => null);
    return guestPhotoStatusSchema.safeParse(body).data?.state ?? null;
  } catch (error) {
    if (passing(error)) throw error;
    const gone = error instanceof EventApiError && error.code === "PHOTO_NOT_FOUND";
    return gone && error.status === 404 ? "declined" : null;
  }
}

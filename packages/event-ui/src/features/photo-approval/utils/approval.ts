import type { WallEvent, WallSnapshotDTO } from "@boothwall/shared";

/** Whether a realtime wall event is `photoId` arriving on the wall. */
export const isArrivalOf = (event: WallEvent | undefined, photoId: string): boolean =>
  event?.type === "photo.created" && event.photo.id === photoId;

/** Whether a wall snapshot already shows `photoId`. */
export const showsPhoto = (snapshot: Pick<WallSnapshotDTO, "photos">, photoId: string): boolean =>
  snapshot.photos.some((photo) => photo.id === photoId);

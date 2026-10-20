import { type PhotoDTO, wallSnapshotSchema } from "@boothwall/shared";

import type { EventTransport } from "#runtime";

/** The newest photos on the wall, for the collage at the top of the upload page. */
export async function fetchLatestPhotos(
  transport: EventTransport,
  limit: number,
): Promise<PhotoDTO[]> {
  const res = await transport.request(`/photos?limit=${limit}`, { access: "public" });
  return wallSnapshotSchema.parse(await res.json()).photos;
}

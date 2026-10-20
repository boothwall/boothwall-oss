import { createControlClient } from "@boothwall/event-ui/control-client";
import type { EventTransport } from "@boothwall/event-ui/runtime";

/** Refresh the amount of approved history the operator has already opened. */
export function createBasicPhotoClient(transport: EventTransport) {
  const client = createControlClient(transport);
  return {
    ...client,
    async fetchApprovedPages(pageCount: number) {
      const first = await client.fetchApproved();
      const photos = [...first.photos];
      let cursor = first.nextCursor;
      for (let page = 1; page < pageCount && cursor; page++) {
        const next = await client.fetchApproved(cursor);
        photos.push(...next.photos.filter((p) => !photos.some((row) => row.id === p.id)));
        cursor = next.nextCursor;
      }
      return { photos, nextCursor: cursor };
    },
  };
}

import {
  controlPhotoSchema,
  type HostMessage,
  photoPageSchema,
  type PhotoPatch,
  photoSchema,
} from "@boothwall/shared";
import { z } from "zod";

import type { EventTransport } from "#runtime";
const pendingSchema = z.object({ photos: z.array(controlPhotoSchema) });
const resultSchema = z.object({ photo: photoSchema });
export function createControlClient(transport: EventTransport) {
  return {
    async updatePhoto(id: string, patch: PhotoPatch) {
      const response = await transport.request(`/photos/${encodeURIComponent(id)}`, {
        access: "control",
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      return z.object({ photo: controlPhotoSchema }).parse(await response.json()).photo;
    },
    async fetchPending() {
      const response = await transport.request("/photos/pending?limit=100", { access: "control" });
      return pendingSchema.parse(await response.json()).photos;
    },
    async fetchApproved(cursor?: string) {
      const params = new URLSearchParams({ status: "approved", limit: "50" });
      if (cursor) params.set("cursor", cursor);
      const response = await transport.request(`/photos/manage?${params}`, { access: "control" });
      return photoPageSchema.parse(await response.json());
    },
    /** Asks every screen that offers it for a photo call, the remote's help or the next theme. */
    async askTv(message: HostMessage): Promise<void> {
      await transport.request("/wall/remote", {
        access: "control",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command: message }),
      });
    },
    async approvePhoto(id: string) {
      const response = await transport.request(`/photos/${encodeURIComponent(id)}/approve`, {
        access: "control",
        method: "POST",
      });
      return resultSchema.parse(await response.json()).photo;
    },
    async removePhoto(id: string): Promise<void> {
      await transport.request(`/photos/${encodeURIComponent(id)}`, {
        access: "control",
        method: "DELETE",
      });
    },
  };
}

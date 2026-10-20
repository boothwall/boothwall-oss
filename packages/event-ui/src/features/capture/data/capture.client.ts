import { type Tribe, type UploadResultDTO, uploadResultSchema } from "@boothwall/shared";

import { newOperationId } from "#lib/ids";
import type { EventTransport } from "#runtime";
export type UploadPhotoArgs = {
  image: Blob;
  thumb: Blob;
  caption: string;
  tribe: Tribe;
  operationId?: string;
};
export function createCaptureClient(transport: EventTransport) {
  const operations = new WeakMap<Blob, WeakMap<Blob, Map<string, string>>>();
  return {
    async uploadPhoto({
      image,
      thumb,
      caption,
      tribe,
      operationId,
    }: UploadPhotoArgs): Promise<UploadResultDTO> {
      const payload = JSON.stringify([caption, tribe]);
      const thumbnails = operations.get(image) ?? new WeakMap<Blob, Map<string, string>>();
      operations.set(image, thumbnails);
      const attempts = thumbnails.get(thumb) ?? new Map<string, string>();
      thumbnails.set(thumb, attempts);
      const identity = operationId ?? attempts.get(payload) ?? newOperationId();
      attempts.set(payload, identity);
      const form = new FormData();
      form.set("image", image, "photo.jpg");
      form.set("thumb", thumb, "thumb.jpg");
      form.set("caption", caption);
      form.set("tribe", tribe);
      form.set("consent", "true");
      const res = await transport.request("/photos", {
        access: "public",
        method: "POST",
        body: form,
        headers: { "idempotency-key": identity },
      });
      return uploadResultSchema.parse(await res.json());
    },
    async removeOwnPhoto(id: string, deleteToken: string): Promise<void> {
      await transport.request(`/photos/${encodeURIComponent(id)}`, {
        access: "public",
        method: "DELETE",
        headers: { "x-delete-token": deleteToken },
      });
    },
  };
}

import type { UploadResultDTO } from "@boothwall/shared";
/** Optional persistence coordination for an embedding host; it carries no admission policy. */
export type UploadLifecycle = {
  replay(input: {
    operationId: string;
    payloadHash: string;
    hasThumb: boolean;
    mediaBytes?: { original: number; thumbnail: number };
  }): Promise<UploadResultDTO | null>;
  begin(input: {
    operationId: string;
    payloadHash: string;
    hasThumb: boolean;
    mediaBytes?: { original: number; thumbnail: number };
  }): Promise<{ photoId: string; deleteToken: string } | { result: UploadResultDTO }>;
  /** Called only after this attempt has stopped writing. Must check durable state before release. */
  failed(photoId: string): Promise<void>;
};

import { PHOTO_LIMITS } from "@boothwall/shared";

import { clientFingerprints } from "@/core/security/client-ip";
import { randomToken, sha256Hex } from "@/core/security/crypto";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import { sanitizeImage } from "./image-sanitation";
import {
  photoCategoryUnknown,
  photoTooBig,
  photoTooLarge,
  photoUnsupportedType,
  photoUploadsClosed,
  photoWallBusy,
} from "./photo.errors";
import { toPhotoDTO } from "./photo.formatters";
import type { PhotoDeps, UploadPhotoArgs, UploadResultDTO } from "./photo.types";
import { wallStats } from "./photo.views";
import { uploadPayloadHash } from "./upload-lifecycle";
import { refuseWhenFull, uploadCaps } from "./upload-limits";

/** Twice what the phone sends, so a slightly different client still gets through. */
const MAX_EDGE_PX = PHOTO_LIMITS.maxEdgePx * 2;
const MAX_THUMB_EDGE_PX = PHOTO_LIMITS.thumbEdgePx * 2;

/** Cheap checks on the declared type and size, before any limit is counted. */
const precheck = (file: File, maxBytes: number) => {
  if (!(PHOTO_LIMITS.mimeTypes as readonly string[]).includes(file.type)) {
    throw photoUnsupportedType({ type: file.type });
  }
  if (file.size > maxBytes) throw photoTooLarge({ bytes: file.size, maxBytes });
};

/** Best effort: a refused upload's objects; storage that fails here keeps them. */
const removeObjects = async (bucket: R2Bucket, keys: (string | null)[]) => {
  for (const key of keys) {
    if (key) await photoStorageRepo.delete(bucket, key).catch(() => {});
  }
};

/** Fresh bytes are fully walked and sanitized before reserving clean storage lengths. */
const readImage = async (raw: ArrayBuffer, maxEdgePx: number) => {
  const clean = await sanitizeImage(new Uint8Array(raw));
  if (Math.max(clean.width, clean.height) > maxEdgePx)
    throw photoTooBig({ width: clean.width, height: clean.height, maxEdgePx });
  return { bytes: clean.bytes.buffer as ArrayBuffer, contentType: clean.contentType };
};

/** A guest's photo arriving: checked, rate-limited, stored, and on the wall if auto-approved. */
export const photoUploadService = {
  async upload(
    deps: PhotoDeps,
    args: UploadPhotoArgs,
  ): Promise<UploadResultDTO & { replayed?: boolean }> {
    const { db, bucket, wallId, origin } = deps;
    const now = deps.now?.() ?? new Date();
    const { image, thumb } = args;

    precheck(image, PHOTO_LIMITS.maxBytes);
    if (thumb) precheck(thumb, PHOTO_LIMITS.thumbMaxBytes);
    const raw = await image.arrayBuffer();
    const rawThumb = thumb ? await thumb.arrayBuffer() : undefined;
    const identity = {
      operationId: args.operationId ?? crypto.randomUUID(),
      payloadHash: await uploadPayloadHash(raw, rawThumb, args.caption, args.tribe),
      hasThumb: !!thumb,
    };
    const replay = await deps.uploadLifecycle?.replay(identity);
    if (replay) return { ...replay, replayed: true };
    const { bytes, contentType } = await readImage(raw, MAX_EDGE_PX);
    const small = rawThumb ? await readImage(rawThumb, MAX_THUMB_EDGE_PX) : undefined;
    if (args.policy.uploadsOpen === false) throw photoUploadsClosed();
    if (!args.policy.categoryIds.includes(args.tribe))
      throw photoCategoryUnknown({ tribe: args.tribe });

    const fingerprints =
      args.channel === "control"
        ? null
        : await clientFingerprints(args.clientIp, now, deps.fingerprintKey, "photo-upload");
    // No visitor identity or venue IP enters the control namespace.
    const ipHash = fingerprints?.current ?? `control:${identity.operationId}`;
    const caps = uploadCaps(fingerprints ? [fingerprints.current, fingerprints.legacy] : [], now);
    await refuseWhenFull(db, wallId, caps);

    const admission = await deps.uploadLifecycle?.begin({
      ...identity,
      mediaBytes: { original: bytes.byteLength, thumbnail: small?.bytes.byteLength ?? 0 },
    });
    if (admission && "result" in admission) return { ...admission.result, replayed: true };
    const id = admission?.photoId ?? crypto.randomUUID();
    const objectKey = `photos/${id}`;
    // Keyed by the photo id, like the image; older rows have no thumbnail.
    const thumbKey = small ? `thumbs/${id}` : null;
    const deleteToken = admission?.deleteToken ?? randomToken();

    try {
      await photoStorageRepo.put(bucket, objectKey, bytes, contentType);
      if (small && thumbKey) {
        await photoStorageRepo.put(bucket, thumbKey, small.bytes, small.contentType);
      }
      const approved = args.policy.autoApprove;
      const row = await photoRepo.createIfUnder(
        db,
        {
          id,
          wallId,
          caption: args.caption,
          tribe: args.tribe,
          status: approved ? "approved" : "pending",
          approvedAt: approved ? now : null,
          objectKey,
          contentType,
          thumbKey,
          ipHash,
          deleteTokenHash: await sha256Hex(deleteToken),
          createdAt: now,
        },
        caps,
      );
      if (!row) {
        // Lost to uploads that arrived together. A host's upload lifecycle (the catch below)
        // releases its reservation and cleans up; without one, the objects go here.
        if (!deps.uploadLifecycle) await removeObjects(bucket, [objectKey, thumbKey]);
        await refuseWhenFull(db, wallId, caps);
        // The counts moved on after the insert was refused; wall-wide is the safe answer.
        throw photoWallBusy({ retryAfterSeconds: 15 * 60 });
      }

      const photo = toPhotoDTO(row, origin);
      // A pending photo reaches the wall when the booth approves it.
      if (approved) {
        await deps.wall
          .broadcast({
            type: "photo.created",
            photo: toPhotoDTO(row, deps.sharedEventOrigin ?? origin),
            stats: await wallStats(db, wallId),
          })
          .catch(() => {
            /* Durable upload succeeded; reconnect refreshes the wall. */
          });
      }
      return { photo, deleteToken };
    } catch (error) {
      await deps.uploadLifecycle?.failed(id).catch(() => {
        /* Durable reconciliation will retry. */
      });
      throw error;
    }
  },
};

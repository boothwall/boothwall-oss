import { PHOTO_LIMITS } from "@boothwall/shared";

import { photoTooLarge, photoUnsupportedType } from "../photo.errors";
import { sniffImageType } from "../photo.image-type";
import { sanitizeJpeg } from "./jpeg";
import { sanitizePng } from "./png";
import { sanitizeWebp } from "./webp";

/** Bounded container sanitation, not image decoding or a guarantee of safe codec input. */
export async function sanitizeImage(source: Uint8Array) {
  if (source.length > PHOTO_LIMITS.maxBytes)
    throw photoTooLarge({ bytes: source.length, maxBytes: PHOTO_LIMITS.maxBytes });
  const contentType = sniffImageType(source);
  if (contentType === "image/jpeg") return { ...sanitizeJpeg(source), contentType };
  if (contentType === "image/png") return { ...(await sanitizePng(source)), contentType };
  if (contentType === "image/webp") return { ...sanitizeWebp(source), contentType };
  throw photoUnsupportedType({ type: contentType ?? "unknown" });
}

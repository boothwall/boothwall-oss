import { PHOTO_LIMITS, type PhotoDTO } from "@boothwall/shared";

/**
 * The copy of a photo to draw `edgeDp` wide at `density` device pixels per dp: the thumbnail
 * while it has the pixels, the original once the thumbnail would be stretched.
 */
export const photoSource = (
  photo: Pick<PhotoDTO, "imageUrl" | "thumbUrl">,
  edgeDp: number,
  density: number,
): string => (edgeDp * density <= PHOTO_LIMITS.thumbEdgePx ? photo.thumbUrl : photo.imageUrl);

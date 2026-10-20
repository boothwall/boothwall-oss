import type { CaptionStyle } from "@boothwall/shared";
import { CAPTION_LOOKS } from "@boothwall/wall-ui/tokens";
import { EmptyPolaroid } from "@boothwall/web-ui";

import { LIVE_PREVIEW_COUNT } from "#features/capture/constants";
import { useCaptureCopy } from "#features/capture/hooks";
import { useLatestPhotos } from "#features/capture/hooks";
import { PolaroidCollage } from "#features/guest-shell/components/photos";

/**
 * The newest photos on the wall, fanned out: the picture that says what this page is for. A
 * wall with nothing on it yet shows blank frames instead, waiting for the first photo.
 */
export function LiveWallPreview({ captionStyle }: { captionStyle: CaptionStyle }) {
  const copy = useCaptureCopy();
  const { photos, loaded } = useLatestPhotos(LIVE_PREVIEW_COUNT);
  if (!loaded) return <div aria-hidden className="aspect-5/4 w-full" />;
  if (photos.length === 0) {
    return (
      <div aria-hidden className="flex aspect-5/4 w-full items-center justify-center">
        <EmptyPolaroid mark="blank" className="w-1/3 -rotate-6" />
        <EmptyPolaroid mark="blank" className="-ml-6 w-2/5 rotate-3" />
      </div>
    );
  }
  return (
    <figure aria-label={copy.livePreview} className="relative">
      <PolaroidCollage
        photos={photos.map((photo) => ({
          id: photo.id,
          src: photo.thumbUrl,
          alt: photo.caption ?? "",
          caption: photo.caption,
        }))}
        captionFont={CAPTION_LOOKS[captionStyle]}
      />
      <figcaption className="absolute inset-x-0 -bottom-1 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-solid px-3 py-1 text-label font-semibold text-ink shadow-paper">
          <span aria-hidden className="size-2 rounded-pill bg-success motion-safe:animate-pulse" />
          {copy.livePreview}
        </span>
      </figcaption>
    </figure>
  );
}

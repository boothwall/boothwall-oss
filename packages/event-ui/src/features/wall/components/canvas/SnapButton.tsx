import { buttonVariants, cn } from "@boothwall/web-ui";
import { Camera } from "lucide-react";

import { BROWSER_WALL_COPY } from "#features/wall/constants";
import { useLocale } from "#i18n";
import { useEventRuntime } from "#runtime";

/**
 * On a phone the wall is something to look at, so it offers the way to join in. Upright it is
 * a full-width button; turned sideways the phone is a preview, so it shrinks to a small pill in
 * the corner and leaves the wall in view.
 */
export function SnapButton() {
  const { links } = useEventRuntime();
  const locale = useLocale();
  const snapUrl = new URL(links.snap, window.location.href);
  snapUrl.searchParams.set("lang", locale);
  return (
    <a
      href={snapUrl.toString()}
      data-testid="snap-button"
      className={cn(
        buttonVariants({ variant: "primary", size: "lg", fullWidth: true }),
        "fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 mx-auto w-auto max-w-md",
        "landscape:inset-x-auto landscape:right-[max(1rem,env(safe-area-inset-right))] landscape:bottom-[max(1rem,env(safe-area-inset-bottom))] landscape:h-11 landscape:px-4 landscape:text-ui landscape:shadow-paper",
      )}
    >
      <Camera aria-hidden className="size-5" strokeWidth={2} />
      {BROWSER_WALL_COPY[locale].addPhoto}
    </a>
  );
}

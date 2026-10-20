import { RotateCw, Smartphone } from "lucide-react";

import { BROWSER_WALL_COPY } from "#features/wall/constants";
import { useLocale } from "#i18n";

import { SnapButton } from "./SnapButton";

/** A phone-sized portrait viewport cannot usefully show the wide wall canvas. */
export function PortraitWallPrompt({ kiosk }: { kiosk: boolean }) {
  const copy = BROWSER_WALL_COPY[useLocale()];
  return (
    <main className="fixed inset-0 flex min-h-dvh items-center justify-center overflow-y-auto bg-page-glow px-gutter pt-safe-top pb-28 text-ink">
      <section
        role="status"
        aria-labelledby="portrait-wall-title"
        data-testid="phone-wall-status"
        className="mx-auto max-w-sm text-center"
      >
        <div
          aria-hidden
          className="relative mx-auto mb-6 flex size-24 items-center justify-center rounded-card border border-line bg-surface"
        >
          <Smartphone className="size-12 -rotate-90" strokeWidth={1.6} />
          <RotateCw className="absolute top-3 right-3 size-5 text-primary-text" strokeWidth={2} />
        </div>
        <h1 id="portrait-wall-title" className="text-title font-bold">
          {copy.rotateTitle}
        </h1>
        <p className="mt-3 text-body text-ink-muted">{copy.rotateBody}</p>
      </section>
      {!kiosk && <SnapButton />}
    </main>
  );
}

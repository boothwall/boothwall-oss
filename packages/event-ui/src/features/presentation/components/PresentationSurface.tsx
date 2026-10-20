import type { EventPresentation } from "@boothwall/shared";
import type { CSSProperties, ReactNode } from "react";

import { PRESENTATION_ART_OPACITY, presentationStyle } from "../utils";
import { EventArtwork } from "./EventArtwork";
export function PresentationSurface({
  presentation,
  children,
}: {
  presentation: EventPresentation;
  children: ReactNode;
}) {
  return (
    <div
      className="relative isolate min-h-dvh"
      style={
        {
          ...presentationStyle(presentation.theme),
          ...(presentation.backdropUrl
            ? {
                backgroundColor: "var(--color-canvas)",
                "--u-page-glow": "none",
              }
            : {}),
        } as CSSProperties
      }
    >
      {presentation.backdropUrl && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          style={{ opacity: PRESENTATION_ART_OPACITY }}
        >
          <EventArtwork src={presentation.backdropUrl} alt="" className="size-full object-cover" />
        </div>
      )}
      {children}
    </div>
  );
}

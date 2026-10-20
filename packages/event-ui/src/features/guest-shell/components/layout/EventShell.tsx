import type { EventPresentation } from "@boothwall/shared";
import { BrandHeader, PageShell, type PageShellProps } from "@boothwall/web-ui";
import type { ReactNode } from "react";

import { EventArtwork, PresentationSurface, useEventPresentation } from "#features/presentation";
import { useEventRuntime } from "#runtime";

export type EventShellProps = Pick<PageShellProps, "children" | "layout"> & {
  eventName?: string;
  presentation?: EventPresentation;
  showSource?: boolean;
  headerAction?: ReactNode;
};
/**
 * Guest identity is scoped to the selected event and its latest settings. With the runtime's
 * `hostLogo`, the app's lockup and the event's logo share one bar and the badge joins the venue.
 */
export function EventShell({
  children,
  layout,
  showSource = true,
  eventName,
  presentation: override,
  headerAction,
}: EventShellProps) {
  const { defaults, links, hostLogo, presentation: configured } = useEventRuntime();
  const presentation = useEventPresentation(override);
  const name = eventName ?? defaults.eventName;
  const eventLogo = hostLogo && presentation.logoUrl;
  const badge = presentation.badge && (
    <span className="rounded-pill border border-line px-3 py-1 text-label">
      {presentation.badge}
    </span>
  );
  const actions = (
    <div className="flex shrink-0 items-center gap-2">
      {badge}
      {headerAction}
    </div>
  );
  const venue =
    presentation.venue &&
    (eventLogo ? (
      <p className="mb-4 flex items-center gap-2 text-label text-ink-muted">
        {presentation.venue}
        {badge}
      </p>
    ) : (
      <p className="mb-4 text-label text-ink-muted">{presentation.venue}</p>
    ));
  return (
    <PresentationSurface presentation={presentation}>
      <PageShell
        layout={layout}
        header={
          eventLogo ? (
            <BrandHeader
              logoSrc={hostLogo.src}
              logoAlt={hostLogo.alt}
              homeHref={links.wall}
              eventLogo={{ src: eventLogo, alt: name }}
              action={venue ? headerAction : (badge || headerAction) && actions}
            />
          ) : (
            <header className="flex items-center justify-between gap-4">
              <a href={links.wall} className="max-w-60 text-title font-bold">
                <EventArtwork
                  src={presentation.logoUrl}
                  alt={name}
                  fallback={name}
                  className="h-12 w-auto"
                />
              </a>
              {actions}
            </header>
          )
        }
      >
        {venue}
        {children}
        {((showSource && presentation.showSourceOnGuest) || configured.notice) && (
          <footer className="mt-auto pt-8 pb-4 text-center text-label text-ink-muted">
            {showSource && presentation.showSourceOnGuest && (
              <a
                href={presentation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {presentation.guestSourceLabel ?? presentation.sourceLabel}
              </a>
            )}
            {configured.notice && (
              <p className="mt-2 text-ink-subtle first:mt-0">{configured.notice}</p>
            )}
          </footer>
        )}
      </PageShell>
    </PresentationSurface>
  );
}

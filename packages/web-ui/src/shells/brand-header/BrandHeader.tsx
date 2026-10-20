import type { ReactNode } from "react";

import { cn } from "#foundations";

export type BrandHeaderProps = {
  logoSrc: string;
  /** Says where the logo leads, e.g. "Acme, back to the home page". */
  logoAlt: string;
  homeHref: string;
  /**
   * A short word set beside the logo, e.g. a booth number. Decorative: put it in
   * `logoAlt` too, so the link's name says it.
   */
  label?: string;
  /** Sits on the right, e.g. a chip or a menu button; under the bar when there's an event logo. */
  action?: ReactNode;
  /**
   * Two brands in one bar: the event's own logo on the right, after a rule, with the logo on
   * the left. Both shrink to share the bar, and the action moves to a row under it.
   */
  eventLogo?: { src: string; alt: string };
};

/**
 * The logo, which leads home, an optional label beside it, and an optional action on the right,
 * in a bar of the fixed header height. The logo is 36px (48px from lg) tall in a 56px (64px)
 * bar: 12px of clear space above and below, more than the brand's 24 symbol units, and its
 * left edge sits on the page gutter like the content under it. A wide logo beside an action
 * shrinks as a whole rather than squeezing.
 */
export function BrandHeader({
  logoSrc,
  logoAlt,
  homeHref,
  label,
  action,
  eventLogo,
}: BrandHeaderProps) {
  const bar = (
    <header
      data-layout="header"
      className="flex h-header shrink-0 items-center justify-between gap-3"
    >
      <a
        href={homeHref}
        className="flex min-w-0 items-center gap-2.5 rounded-control transition active:scale-95"
      >
        <img
          src={logoSrc}
          alt={logoAlt}
          className={cn(
            "w-auto min-w-0 shrink object-contain object-left",
            eventLogo ? "h-6 lg:h-8.5" : "h-9 lg:h-12",
          )}
        />
        {label && (
          <span
            aria-hidden
            className="shrink-0 rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold text-ink-muted lg:text-sm"
          >
            {label}
          </span>
        )}
      </a>
      {eventLogo ? (
        <span className="flex min-w-0 items-center gap-3 lg:gap-5">
          <span aria-hidden className="w-px self-stretch bg-line" />
          <img
            src={eventLogo.src}
            alt={eventLogo.alt}
            className="h-5 w-auto min-w-0 shrink object-contain object-right lg:h-7.5"
          />
        </span>
      ) : (
        action
      )}
    </header>
  );
  if (!eventLogo || !action) return bar;
  return (
    <>
      {bar}
      <div className="mt-3 flex items-center gap-2 lg:justify-end">{action}</div>
    </>
  );
}

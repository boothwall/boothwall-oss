import type { ReactNode } from "react";

import { cn } from "#foundations";
import { EmptyPolaroid } from "#primitives";

export type EmptyStateProps = {
  /** Required: what's empty, in a few words, e.g. "Queue's clear". */
  title: string;
  /** One line under the title: what happens next or what to do. */
  description?: string;
  /**
   * An icon (e.g. a lucide icon), shown in a round well. Without one, a blank polaroid frame
   * stands in, so the state never looks like a missing image.
   */
  icon?: ReactNode;
  /** The one next step, e.g. a Button or a link styled with buttonVariants. */
  action?: ReactNode;
  /** The heading level that fits the page outline. */
  headingLevel?: 2 | 3;
  className?: string;
};

/** An empty list or page that says what's missing and offers the next step, centred. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel = 2,
  className,
}: EmptyStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-gutter py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden
          className="mb-5 flex size-14 items-center justify-center rounded-pill border border-line bg-surface text-ink-muted [&_svg]:size-6"
        >
          {icon}
        </div>
      ) : (
        <EmptyPolaroid mark="blank" className="mb-7 w-24" />
      )}
      <Heading className="text-title font-bold text-ink">{title}</Heading>
      {description && <p className="mt-2 max-w-xs text-ui text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

import { cn } from "#foundations";

export type SkeletonProps = {
  /** Size and shape it with utilities, e.g. "h-4 w-32" or "aspect-video w-full". */
  className?: string;
};

/** A placeholder block for content that is still loading. Hidden from screen readers. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block overflow-hidden rounded-control bg-surface-strong shimmer-subtle",
        className,
      )}
    >
      <span className="absolute inset-0 motion-safe:animate-shimmer" />
    </span>
  );
}

import { cn } from "@boothwall/web-ui";

/** A count on the primary colour, e.g. the photos waiting beside the Waiting tab. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid h-5.5 min-w-5.5 place-items-center rounded-pill bg-primary px-1.5 text-xs font-bold text-on-primary",
        className,
      )}
    >
      {count}
    </span>
  );
}

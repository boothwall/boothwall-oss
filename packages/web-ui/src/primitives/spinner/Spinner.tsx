import { cn } from "#foundations";

export type SpinnerProps = { className?: string };

/** A small ring that turns in the current text colour. Decorative: say what's busy elsewhere. */
export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-4 motion-safe:animate-spin", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.25} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

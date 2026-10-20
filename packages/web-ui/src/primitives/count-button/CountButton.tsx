import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode, useRef } from "react";

import { cn } from "#foundations";

export const countButtonVariants = cva(
  "flex flex-col items-center justify-center gap-0.5 rounded-control font-semibold tabular-nums transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-90 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      tone: {
        /** On the dark canvas. */
        glass: "border border-line bg-surface text-ink hover:bg-surface-strong",
        /** On a light paper card. */
        paper: "bg-paper-ink/5 text-paper-ink hover:bg-paper-ink/10",
      },
      size: {
        sm: "h-11 min-w-10 px-1.5 text-2xs",
        md: "h-14 min-w-14 px-3 text-xs",
        /** A tray of a few big targets, e.g. under a photo seen on its own. */
        lg: "h-20 min-w-16 gap-1.5 px-3 text-sm",
      },
      /** Marks a counter the viewer has added to, e.g. their own reaction: a ring, no fill. */
      active: {
        true: "border-primary ring-1 ring-primary",
        false: "",
      },
    },
    defaultVariants: { tone: "glass", size: "sm", active: false },
  },
);

const ICON_SIZES = { sm: "text-base", md: "text-xl", lg: "text-4xl" } as const;

export type CountButtonProps = VariantProps<typeof countButtonVariants> & {
  /** An emoji or icon, drawn above the count. */
  icon: ReactNode;
  count: number;
  /** Required: the icon alone says nothing to a screen reader. */
  label: string;
  /** Draws just the icon while the count is 0; the label still says it. */
  hideZero?: boolean;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
};

/** A tappable counter: an icon over its count, which swells each time the count goes up. */
export function CountButton({
  icon,
  count,
  label,
  hideZero = false,
  onPress,
  disabled,
  tone,
  size,
  active,
  className,
}: CountButtonProps) {
  // Only a change swells the icon, not the first paint of a whole list of counters.
  const firstCount = useRef(count);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      disabled={disabled}
      className={cn(countButtonVariants({ tone, size, active }), className)}
    >
      <span
        key={count}
        aria-hidden
        className={cn(
          "leading-none",
          ICON_SIZES[size ?? "sm"],
          count !== firstCount.current && "animate-bump",
        )}
      >
        {icon}
      </span>
      {!(hideZero && count === 0) && (
        <span aria-hidden className="leading-none">
          {count}
        </span>
      )}
    </button>
  );
}

import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "#foundations";

export const chipVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 rounded-pill font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-strong text-ink-muted",
        primary: "bg-primary/15 text-primary-text",
        success: "bg-success/15 text-success",
        info: "bg-secondary/15 text-secondary",
        danger: "bg-danger/15 text-danger",
      },
      size: {
        sm: "h-6 px-2.5 text-xs",
        md: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export type ChipProps = VariantProps<typeof chipVariants> & {
  /** Required: the words carry the meaning, so a status is never colour alone. */
  children: ReactNode;
  /** A small dot before the label; "pulse" for something happening right now. */
  dot?: "static" | "pulse";
  className?: string;
};

/** A short status or tag. */
export function Chip({ tone, size, dot, className, children }: ChipProps) {
  return (
    <span className={cn(chipVariants({ tone, size }), className)}>
      {dot && (
        <span aria-hidden className="relative flex size-1.5">
          {dot === "pulse" && (
            <span className="absolute inset-0 rounded-pill bg-current opacity-60 motion-safe:animate-ping" />
          )}
          <span className="relative size-1.5 rounded-pill bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

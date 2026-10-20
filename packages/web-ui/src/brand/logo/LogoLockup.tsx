import { cva } from "class-variance-authority";

import { cn } from "#foundations";

import { LOGO_SOURCES, type LogoTone } from "./logoSources";

export type LogoLockupVariant = "horizontal" | "symbol" | "self-hosted";
export type LogoLockupSize = "sm" | "md" | "lg" | "tv";

export type LogoLockupProps = {
  /** The horizontal lockup (default), the two-card symbol, or the lockup with the edition label. */
  variant?: LogoLockupVariant;
  /** "on-dark" for the navy canvas (default), "on-light" for paper and white. */
  tone?: LogoTone;
  /**
   * sm is the smallest the lockup may go on the web (170px wide), tv is a 1080p wall header
   * (about 480px). The symbol never goes below 32px high.
   */
  size?: LogoLockupSize;
  /** Required: what the logo stands for here, e.g. "BoothWall, home"; "" when text beside it says so. */
  alt: string;
  /** The edition named beside the self-hosted lockup. */
  editionLabel?: string;
  className?: string;
};

const lockupHeight = cva("w-auto shrink-0 select-none", {
  variants: {
    size: { sm: "h-7", md: "h-9", lg: "h-12", tv: "h-20" },
  },
});

const symbolSize = cva("shrink-0 select-none", {
  variants: {
    size: { sm: "h-8", md: "h-10", lg: "h-14", tv: "h-24" },
  },
});

const labelText = cva("font-semibold whitespace-nowrap", {
  variants: {
    size: { sm: "text-label", md: "text-ui", lg: "text-body", tv: "text-title" },
    tone: { "on-dark": "text-ink-muted", "on-light": "text-paper-ink" },
  },
});

/**
 * The BoothWall logo from the brand's own artwork. The self-hosted variant sets the edition as
 * text beside the lockup rather than using the artwork's small baked-in label, which the brand
 * guide only allows from 400px wide.
 */
export function LogoLockup({
  variant = "horizontal",
  tone = "on-dark",
  size = "md",
  alt,
  editionLabel = "Self-hosted edition",
  className,
}: LogoLockupProps) {
  if (variant === "symbol") {
    return (
      <img
        src={LOGO_SOURCES.symbol[tone]}
        alt={alt}
        width={176}
        height={160}
        className={cn(symbolSize({ size }), "w-auto", className)}
      />
    );
  }

  const lockup = (
    <img
      src={LOGO_SOURCES.horizontal[tone]}
      alt={alt}
      width={680}
      height={112}
      className={cn(lockupHeight({ size }), variant === "horizontal" && className)}
    />
  );
  if (variant === "horizontal") return lockup;

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {lockup}
      <span
        className={cn(
          "border-l pl-3",
          tone === "on-dark" ? "border-line" : "border-paper-ink/20",
          labelText({ size, tone }),
        )}
      >
        {editionLabel}
      </span>
    </span>
  );
}

import type { ReactNode } from "react";

import { cn } from "#foundations";

import { PhotoImage } from "../photo-image/PhotoImage";

export type PolaroidCaptionFont = {
  fontFamily?: string;
  fontWeight?: string;
  scale: number;
};

type PolaroidBaseProps = {
  src: string;
  alt: string;
  /** A small copy shown blurred while `src` loads, like the thumbnail of a full-size photo. */
  placeholderSrc?: string;
  /** Caption typeface (Kalam when unset); scale evens out fonts that draw small or large. */
  captionFont?: PolaroidCaptionFont;
  /** Leans the card, in degrees. Keep it between 1.5 and 4 either way; 0 or unset is upright. */
  tilt?: number;
  /** Pinned to the top-right corner, half off the paper, e.g. a status chip or a count. */
  badge?: ReactNode;
  /** Below the caption, inside the paper, e.g. reactions. */
  footer?: ReactNode;
  /**
   * "sm" for grids of many, "md" for a photo on its own. Only the caption size changes; on thin
   * paper the caption follows the card's width instead.
   */
  size?: "sm" | "md";
  /** "thin" paper for small cards in a dense grid; "brand" is the logo's proportions. */
  paper?: "brand" | "thin";
  className?: string;
};

export type PolaroidProps = PolaroidBaseProps & {
  caption?: ReactNode;
};

const PAPER = {
  brand: {
    photo: "px-polaroid-edge pt-polaroid-edge",
    chin: "h-polaroid-chin px-polaroid-edge",
    foot: "px-polaroid-edge pb-polaroid-edge",
  },
  thin: {
    photo: "px-polaroid-edge-thin pt-polaroid-edge-thin",
    chin: "h-polaroid-chin-thin px-polaroid-edge-thin",
    foot: "px-polaroid-edge-thin pb-polaroid-edge-thin",
  },
};

const CAPTION = {
  sm: { className: "text-ui", size: "0.9375rem" },
  md: { className: "text-hand", size: "1.25rem" },
};

/** Thin paper sits in dense grids of any width, so its caption scales with the card. */
const THIN_CAPTION = {
  className: "text-polaroid-caption",
  size: "var(--u-polaroid-caption-thin)",
};

/**
 * A photo on cream polaroid paper in the brand's geometry (the logo's front card): thin even
 * paper at the top and sides, a deep chin for a handwritten caption. Its width comes from the
 * container; every edge scales with it.
 */
export function Polaroid({
  src,
  alt,
  placeholderSrc,
  caption,
  captionFont,
  tilt,
  badge,
  footer,
  size = "md",
  paper = "brand",
  className,
}: PolaroidProps) {
  const look = paper === "thin" ? THIN_CAPTION : CAPTION[size];
  const frame = PAPER[paper];
  const fontStyle = captionFont && {
    fontFamily: captionFont.fontFamily,
    fontWeight: captionFont.fontWeight,
    fontSize: `calc(${look.size} * ${captionFont.scale})`,
  };
  return (
    <figure
      className={cn("relative @container rounded-paper bg-paper shadow-paper", className)}
      style={tilt ? { rotate: `${tilt}deg` } : undefined}
    >
      <div className={frame.photo}>
        <PhotoImage
          src={src}
          alt={alt}
          placeholderSrc={placeholderSrc}
          loading="lazy"
          className="aspect-square w-full rounded-photo"
        />
      </div>
      <figcaption
        className={cn(
          "flex items-center justify-center font-hand text-paper-ink",
          frame.chin,
          look.className,
        )}
        style={fontStyle || undefined}
      >
        <span className="truncate">{caption}</span>
      </figcaption>
      {footer && <div className={frame.foot}>{footer}</div>}
      {badge && <div className="absolute -top-2.5 -right-2.5">{badge}</div>}
    </figure>
  );
}

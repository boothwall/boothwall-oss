import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default scale, so it is told the theme's named steps;
 * otherwise `text-ui` (a size) and `text-on-primary` (a colour) would cancel each other out.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "title",
        "body",
        "ui",
        "label",
        "hand",
        "2xs",
        "polaroid-caption",
        "polaroid-meta",
      ],
      radius: ["card", "control", "tile", "paper", "photo", "pill"],
      shadow: ["glow", "paper"],
      font: ["sans", "hand"],
      spacing: ["gutter", "section", "polaroid-edge", "polaroid-chin", "tv-bezel"],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

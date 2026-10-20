import { cva, type VariantProps } from "class-variance-authority";

/**
 * The one "pick one of a few" look, shared by SegmentedControl (radios) and by app tab rows
 * (role="tab" buttons): a quiet track, and the selected segment filled in ink, so it reads at a
 * glance, more plainly than a ring would. Primary actions are amber, so the ink
 * fill doesn't compete with them.
 */
export const segmentGroupVariants = cva("gap-1 rounded-control border border-line p-1", {
  variants: {
    /** "solid" sits on the canvas; "glass" floats over scrolling content (sticky tab bars). */
    surface: {
      solid: "bg-surface",
      glass: "bg-canvas/80 backdrop-blur-md",
    },
  },
  defaultVariants: { surface: "solid" },
});

export const segmentVariants = cva(
  // Focus works for both a radio inside a label and a button: one outline either way.
  "flex cursor-pointer items-center justify-center gap-2 rounded-tile font-semibold transition select-none active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
  {
    variants: {
      selected: {
        true: "bg-ink text-canvas shadow-paper",
        false: "text-ink-muted hover:bg-surface hover:text-ink",
      },
      size: {
        sm: "h-9 px-2 text-ui",
        md: "h-11 px-3 text-ui",
      },
    },
    defaultVariants: { selected: false, size: "sm" },
  },
);

export type SegmentVariantProps = VariantProps<typeof segmentVariants>;

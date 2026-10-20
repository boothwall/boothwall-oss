import { cva, type VariantProps } from "class-variance-authority";

/**
 * The one button look, shared by Button, IconButton and links styled as buttons.
 *
 * - primary: amber with navy text, the single main action on a screen.
 * - secondary: a bordered surface, for everything else that matters.
 * - ghost: text only, for low-stakes actions in toolbars and headers.
 * - destructive: red text, for removing and rejecting.
 *
 * Disabled (the attribute, or aria-disabled for a button that must stay focusable; a busy
 * button keeps its look) is 40% opacity. Primary instead stays at full opacity and goes neutral,
 * the strong surface with a subtle label: visible on a card, and never faded so far that what
 * scrolls behind a sticky bar shows through it (the bar itself is opaque). An outline there read as a different kind of button rather than
 * the same one waiting, and a faded amber fill mixes into a muddy brown on navy and graphite.
 */
export const BUTTON_VARIANT = {
  primary:
    "bg-primary text-on-primary hover:brightness-105 disabled:bg-surface-strong disabled:text-ink-subtle disabled:opacity-100 aria-disabled:not-aria-busy:bg-surface-strong aria-disabled:not-aria-busy:text-ink-subtle aria-disabled:not-aria-busy:opacity-100",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-strong",
  ghost: "text-ink-muted hover:bg-surface hover:text-ink",
  // A clear red outline: a destructive action is never just red text on the canvas.
  destructive: "border border-danger/60 text-danger hover:border-danger hover:bg-danger/10",
} as const;

const BASE =
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap transition select-none active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40 aria-disabled:not-aria-busy:cursor-not-allowed aria-disabled:not-aria-busy:opacity-40 aria-busy:cursor-progress";

export const buttonVariants = cva(BASE, {
  variants: {
    variant: BUTTON_VARIANT,
    size: {
      sm: "h-9 px-3.5 text-label",
      md: "h-11 px-5 text-ui",
      lg: "h-14 px-6 text-body",
    },
    /** Stretches to the width of its container, e.g. the one action at the foot of a phone page. */
    fullWidth: { true: "w-full", false: "" },
  },
  defaultVariants: { variant: "secondary", size: "md", fullWidth: false },
});

/** Square buttons that hold one icon; the same heights as the text buttons. */
export const iconButtonVariants = cva(BASE, {
  variants: {
    variant: BUTTON_VARIANT,
    size: {
      sm: "size-9 [&_svg]:size-4",
      md: "size-11 [&_svg]:size-5",
      lg: "size-14 [&_svg]:size-6",
    },
  },
  defaultVariants: { variant: "ghost", size: "md" },
});

export type ButtonVariant = keyof typeof BUTTON_VARIANT;
export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;

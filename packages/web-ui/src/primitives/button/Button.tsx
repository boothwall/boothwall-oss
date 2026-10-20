import type { ComponentPropsWithoutRef } from "react";

import { cn } from "#foundations";

import { Spinner } from "../spinner/Spinner";
import { type ButtonVariantProps, buttonVariants } from "./buttonVariants";
import { loadingProps } from "./loadingProps";

export type ButtonProps = ComponentPropsWithoutRef<"button"> &
  ButtonVariantProps & {
    /**
     * Shows a spinner before the label and blocks presses until the work is done. The label
     * stays, so the button keeps its width and still says what it's doing.
     */
    loading?: boolean;
  };

/** A text button: one look, four variants, three sizes. Icons go in `children` beside the label. */
export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  onClick,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
      {...loadingProps(loading, onClick)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

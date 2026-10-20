import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "#foundations";

import { Spinner } from "../spinner/Spinner";
import { type IconButtonVariantProps, iconButtonVariants } from "./buttonVariants";
import { loadingProps } from "./loadingProps";

export type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label"> &
  IconButtonVariantProps & {
    /** The icon, e.g. a lucide icon. Decorative: `label` names the button. */
    icon: ReactNode;
    /** Required: an icon alone says nothing to a screen reader. Also shown as the tooltip. */
    label: string;
    loading?: boolean;
  };

/** A round button holding one icon. Its own component because the accessible name is required. */
export function IconButton({
  icon,
  label,
  variant,
  size,
  loading = false,
  onClick,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
      {...loadingProps(loading, onClick)}
    >
      {loading ? (
        <Spinner />
      ) : (
        <span aria-hidden className="contents">
          {icon}
        </span>
      )}
    </button>
  );
}

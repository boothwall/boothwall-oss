import { X } from "lucide-react";
import type { ReactNode } from "react";

import { iconButtonVariants } from "#primitives";

export type SheetHeaderProps = {
  title: string;
  /** For a dialog labelled by its title (aria-labelledby). */
  titleId?: string;
  /** One quiet line under the title, e.g. a status or a category. */
  subtitle?: ReactNode;
  /** A small brand-tinted icon before the title. */
  icon?: ReactNode;
  onClose: () => void;
  closeLabel: string;
};

/**
 * The one header every sheet and dialog opens with: an optional icon, the title (with a quiet
 * line under it) and the close button, all at the same sizes everywhere.
 */
export function SheetHeader({
  title,
  titleId,
  subtitle,
  icon,
  onClose,
  closeLabel,
}: SheetHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && (
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-primary/15 text-primary-text [&_svg]:size-5"
        >
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 id={titleId} className="truncate text-lg font-bold tracking-tight">
          {title}
        </h2>
        {subtitle && <div className="truncate text-label text-ink-muted">{subtitle}</div>}
      </div>
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className={iconButtonVariants({ variant: "secondary", size: "md" })}
      >
        <X aria-hidden strokeWidth={1.8} />
      </button>
    </div>
  );
}

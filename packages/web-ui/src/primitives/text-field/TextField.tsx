import { type ComponentPropsWithoutRef, type ReactNode, useId } from "react";

import { cn, FIELD_STYLES, useFieldScale } from "#foundations";

export type TextFieldProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "id" | "aria-describedby" | "aria-invalid" | "className"
> & {
  /** Required: every field is named. */
  label: string;
  /** Read out but not shown, when the layout already says what the field is. */
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Shown under the field, replaces the hint and marks the field invalid. */
  error?: string | null;
  /** Something on the right of the label row, e.g. a characters-left count. */
  aside?: ReactNode;
  className?: string;
};

/** A labelled text input with its hint or error underneath, wired up for screen readers. */
export function TextField({
  label,
  hideLabel,
  hint,
  error,
  aside,
  className,
  ...input
}: TextFieldProps) {
  const id = useId();
  const noteId = useId();
  const note = error ?? hint;
  const size = FIELD_STYLES[useFieldScale()];
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className={cn("flex items-baseline justify-between gap-3", hideLabel && "sr-only")}>
        <label htmlFor={id} className={cn(size.label, "text-ink")}>
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        aria-describedby={note ? noteId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full border bg-surface text-ink transition placeholder:text-ink-subtle focus:outline-none focus-visible:outline-none",
          size.input,
          size.focusRing,
          error
            ? "border-danger focus:ring-danger/30"
            : "border-line hover:border-ink-subtle focus:border-primary focus:ring-primary/25",
        )}
        {...input}
      />
      {note && (
        <p
          id={noteId}
          role={error ? "alert" : undefined}
          className={cn(size.note, error ? "text-danger" : "text-ink-subtle")}
        >
          {note}
        </p>
      )}
    </div>
  );
}

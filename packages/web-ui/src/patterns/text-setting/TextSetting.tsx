import { type HTMLAttributes, useId } from "react";

import { cn, FIELD_STYLES, useFieldScale } from "#foundations";

export type TextSettingProps = {
  label: string;
  /** Visible label; otherwise it's only read out by screen readers. */
  showLabel?: boolean;
  value: string;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  /** Which keyboard a phone shows, e.g. "numeric" for a year. */
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
  /** Words the count, e.g. (n) => `${n} characters left`; the app owns the copy. No count without it. */
  remainingLabel?: (left: number) => string;
};

/** A one-line text setting, with a characters-left count when `remainingLabel` is given. */
export function TextSetting({
  label,
  showLabel = true,
  value,
  maxLength,
  placeholder,
  hint,
  inputMode,
  onChange,
  remainingLabel,
}: TextSettingProps) {
  const id = useId();
  const hintId = useId();
  const scale = useFieldScale();
  const size = FIELD_STYLES[scale];
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <label
        htmlFor={id}
        className={
          showLabel ? cn(size.label, scale === "lg" ? "text-ink" : "text-ink-muted") : "sr-only"
        }
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full border border-line bg-surface text-ink focus:outline-none",
          scale === "lg"
            ? cn(size.input, size.focusRing, "focus:border-primary focus:ring-primary/25")
            : "h-12 rounded-control px-4 text-base focus:border-ink",
        )}
      />
      <p
        id={hintId}
        className={cn(
          "px-1 text-ink-subtle tabular-nums",
          scale === "lg" ? "text-label" : "text-xs",
        )}
      >
        {[hint, remainingLabel?.(maxLength - value.length)].filter(Boolean).join(" ")}
      </p>
    </div>
  );
}

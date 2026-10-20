import { type ReactNode, useId } from "react";

import { cn } from "#foundations";

export type SettingSwitchProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown but can't be changed, e.g. a feature this deployment can't run. */
  disabled?: boolean;
  /** Decorative, before the label, such as an icon. */
  leading?: ReactNode;
  /** Beside the label, such as an info button; must not be the switch's name. */
  labelAddon?: ReactNode;
};

/** One on/off setting: label and hint on the left, a switch on the right. */
export function SettingSwitch({
  label,
  hint,
  checked,
  onChange,
  disabled,
  leading,
  labelAddon,
}: SettingSwitchProps) {
  const labelId = useId();
  const hintId = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1">
            <span id={labelId} className="font-medium">
              {label}
            </span>
            {labelAddon}
          </span>
          {hint && (
            <span id={hintId} className="text-sm text-ink-muted">
              {hint}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-pill border transition focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-40",
          checked ? "border-primary bg-primary" : "border-line bg-surface-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-[3px] size-5 rounded-pill bg-paper shadow transition-[left]",
            checked ? "left-[1.5rem]" : "left-[3px]",
          )}
        />
      </button>
    </div>
  );
}

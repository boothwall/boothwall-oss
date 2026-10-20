import { cn } from "#foundations";

import { segmentGroupVariants, segmentVariants } from "./segmentVariants";

export type SegmentedOption<Value extends string> = { value: Value; label: string };

export type SegmentedControlProps<Value extends string> = {
  /** Names the group; required, a row of options means nothing without it. */
  legend: string;
  /** Shown above the options; hidden when the context already says it (still read out). */
  hideLegend?: boolean;
  /** Radio group name, unique on the page. */
  name: string;
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
};

/** One choice out of a few, as a row of segments: radio buttons underneath, so arrows work. */
export function SegmentedControl<Value extends string>({
  legend,
  hideLegend,
  name,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<Value>) {
  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)}>
      <legend
        className={cn(
          hideLegend ? "sr-only" : "mb-1.5 px-1 text-label font-medium text-ink-subtle",
        )}
      >
        {legend}
      </legend>
      <div className={cn("flex", segmentGroupVariants())}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(segmentVariants({ selected: value === option.value }), "flex-1")}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

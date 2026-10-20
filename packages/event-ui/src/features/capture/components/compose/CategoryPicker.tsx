import { catchAllOf, type Category, type Tribe } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";
import { Check } from "lucide-react";

import { useCaptureCopy } from "#features/capture/hooks";

export type CategoryPickerProps = {
  /** The live list. */
  categories: readonly Category[];
  value: Tribe | null;
  onChange: (tribe: Tribe) => void;
};

/**
 * The categories as a row of chips. With a catch-all, picking is optional: the catch-all isn't
 * offered as a chip, it's what an untouched (or un-picked) choice files under.
 */
export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const copy = useCaptureCopy();
  const catchAll = catchAllOf(categories);
  const chips = catchAll ? categories.filter((category) => category.id !== catchAll) : categories;
  // Tapping the picked chip again un-picks it, back to the catch-all.
  const toggle = (id: Tribe) => {
    if (id === value && catchAll) onChange(catchAll);
    else onChange(id);
  };
  return (
    <fieldset>
      <legend className="mb-2.5 text-label font-medium text-ink-muted">
        {copy.tribeLabel}
        {catchAll && <span className="text-ink-subtle"> · {copy.optional}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {chips.map(({ id, label }) => {
          const selected = value === id;
          return (
            <label
              key={id}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border px-3.5 text-label font-semibold transition select-none active:scale-98 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink",
                selected
                  ? "border-primary bg-surface-strong text-ink ring-1 ring-primary"
                  : "border-line bg-surface text-ink-muted hover:bg-surface-strong hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="tribe"
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
                onClick={() => selected && toggle(id)}
                className="sr-only"
              />
              {selected && (
                <Check aria-hidden className="size-3.5 text-primary-text" strokeWidth={2.4} />
              )}
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

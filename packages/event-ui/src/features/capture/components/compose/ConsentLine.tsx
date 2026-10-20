import { cn } from "@boothwall/web-ui";
import type { Ref } from "react";

import { useCaptureCopy } from "#features/capture/hooks";

export type ConsentLineProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** Set after a press on Send that the box blocked: the line lights up to say why. */
  nudged: boolean;
  inputRef?: Ref<HTMLInputElement>;
};

/** The consent, in full, in a box of its own: OK to show this photo on the public screen. */
export function ConsentLine({ checked, onChange, nudged, inputRef }: ConsentLineProps) {
  const copy = useCaptureCopy();
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-4 text-label text-ink-muted transition",
        nudged &&
          !checked &&
          "bg-primary/10 text-ink ring-1 ring-primary motion-safe:animate-pop-in",
      )}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      {copy.consent}
    </label>
  );
}

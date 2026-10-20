import { cn } from "#foundations";

export type EmptyPolaroidProps = {
  /**
   * "add" draws a plus where the photo goes, for a place the viewer can fill ("add yours");
   * "blank" leaves the dashed frame empty, for a list that's simply empty ("queue's clear").
   */
  mark?: "add" | "blank";
  className?: string;
};

/**
 * A blank polaroid in the brand geometry, slightly tilted, with a dashed outline where the
 * photo will go: the kit's one picture for "nothing here yet". Decorative.
 */
export function EmptyPolaroid({ mark = "add", className }: EmptyPolaroidProps) {
  return (
    <div aria-hidden className={cn("w-28 -rotate-3 @container", className)}>
      <div className="rounded-paper bg-paper px-polaroid-edge pt-polaroid-edge shadow-paper">
        <div className="flex aspect-square items-center justify-center rounded-photo border-2 border-dashed border-paper-ink/25 bg-paper-ink/5">
          {mark === "add" && (
            <svg viewBox="0 0 24 24" className="size-1/4 text-paper-ink/45" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <div className="h-polaroid-chin" />
      </div>
    </div>
  );
}

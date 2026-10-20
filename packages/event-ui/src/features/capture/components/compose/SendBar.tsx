import { Button } from "@boothwall/web-ui";
import { Send } from "lucide-react";
import { useId } from "react";

import { useCaptureCopy } from "#features/capture/hooks";

export type SendBarProps = {
  ready: boolean;
  /** Read out with the button while it's not ready: what's still missing. */
  hint: string;
  sending: boolean;
  /** A press while not ready: show the guest what's missing instead of sending. */
  onBlocked: () => void;
};

/**
 * The Send button at the foot of the compose form. On a phone it sticks to the bottom on an
 * opaque canvas, so nothing it passes over shows through; only the button sticks, so it never
 * hides the fields above it, and it's the last thing in the form. Until the box is ticked the button wears the kit's disabled
 * look but stays pressable (aria-disabled): pressing it early points at what's missing.
 */
export function SendBar({ ready, hint, sending, onBlocked }: SendBarProps) {
  const copy = useCaptureCopy();
  const hintId = useId();
  return (
    <div className="sticky bottom-0 z-10 -mx-gutter mt-auto bg-canvas px-gutter pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:mt-0 lg:p-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-canvas to-transparent lg:hidden"
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={sending}
        aria-disabled={!ready || undefined}
        aria-describedby={ready ? undefined : hintId}
        onClick={(event) => {
          if (ready) return;
          event.preventDefault();
          onBlocked();
        }}
      >
        {!sending && <Send aria-hidden className="size-5" strokeWidth={1.8} />}
        {sending ? copy.sending : copy.submit}
      </Button>
      {!ready && (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      )}
    </div>
  );
}

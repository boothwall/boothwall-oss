import { Button } from "@boothwall/web-ui";

import { controlCopy, FOCUS_LIFT } from "@/features/control/constants";

/** A failed read or decision: what's on screen stays, and Retry asks again. */
export function FailureBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger p-4"
    >
      <p>{message}</p>
      <Button size="sm" className={FOCUS_LIFT} onClick={onRetry}>
        {controlCopy.failure.retry}
      </Button>
    </div>
  );
}

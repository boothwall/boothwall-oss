import { Button } from "@boothwall/web-ui";

import { deskCopy, FOCUS_LIFT } from "@/features/control/constants";

const copy = deskCopy.review;

/** The second step of Reject and Remove: both delete the photo for good. */
export function ConfirmRemove({
  waiting,
  busy,
  onConfirm,
  onCancel,
}: {
  waiting: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-ink-muted">{copy.confirm}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="sm"
          className={FOCUS_LIFT}
          disabled={busy}
          onClick={onConfirm}
        >
          {waiting ? copy.confirmReject : copy.confirmRemove}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={FOCUS_LIFT}
          disabled={busy}
          onClick={onCancel}
        >
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
}

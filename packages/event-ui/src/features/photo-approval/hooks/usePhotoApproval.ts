import type { GuestPhotoState, PhotoDTO } from "@boothwall/shared";
import { useEffect, useState } from "react";

import { APPROVAL_GIVE_UP_MS, APPROVAL_SLOW_MS } from "#features/photo-approval/constants";
import { watchApproval } from "#features/photo-approval/data";
import { useEventRuntime } from "#runtime";

export type PhotoApproval = {
  /** On the wall: approved at upload, or since. */
  live: boolean;
  /** Still waiting after a while, so a person has to approve it. */
  slow: boolean;
  /** Waiting, live, or declined by the host (only known when the delete token was given). */
  state: GuestPhotoState;
};

type Settled = { id: string; state: Exclude<GuestPhotoState, "waiting"> };

/**
 * Whether a just-sent photo is on the wall yet. A photo approved at upload is live at once;
 * a pending one is watched until it lands (see watchApproval) or for a quarter of an hour.
 * With the sender's delete token, both are watched for that quarter hour, including after
 * approval, so the page also hears when the host removes the photo.
 */
export function usePhotoApproval(
  photo: Pick<PhotoDTO, "id" | "status"> | null,
  deleteToken?: string,
): PhotoApproval {
  const { transport } = useEventRuntime();
  const id = photo?.id ?? null;
  const approvedAtUpload = photo?.status === "approved";
  const [settled, setSettled] = useState<Settled | null>(null);
  const [slow, setSlow] = useState<string | null>(null);

  useEffect(() => {
    if (!id || (approvedAtUpload && !deleteToken)) return;
    const stop = watchApproval(transport, id, () => setSettled({ id, state: "live" }), {
      deleteToken,
      onDeclined: () => setSettled({ id, state: "declined" }),
    });
    const slowTimer = window.setTimeout(() => setSlow(id), APPROVAL_SLOW_MS);
    const giveUp = window.setTimeout(stop, APPROVAL_GIVE_UP_MS);
    return () => {
      stop();
      window.clearTimeout(slowTimer);
      window.clearTimeout(giveUp);
    };
  }, [id, approvedAtUpload, deleteToken, transport]);

  const state: GuestPhotoState =
    id !== null && settled?.id === id ? settled.state : approvedAtUpload ? "live" : "waiting";
  return { live: state === "live", slow: state === "waiting" && id !== null && slow === id, state };
}

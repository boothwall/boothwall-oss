import type { Category } from "@boothwall/shared";
import type { PhotoImagePhase } from "@boothwall/web-ui";
import { useState } from "react";

import type { ControlPhotos } from "@/features/control/hooks";

import { WaitingMini } from "./WaitingMini";
import { WaitingReview } from "./WaitingReview";

/** The waiting queue: the photo being decided on, then the rest, any of which can be brought up. */
export function WaitingQueue({
  photos,
  categories,
  confirm,
  onConfirmChange,
}: {
  photos: ControlPhotos;
  categories: readonly Category[];
  confirm: string | null;
  onConfirmChange: (id: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  /** Each waiting photo's original; Approve needs it loaded. */
  const [originals, setOriginals] = useState<Record<string, PhotoImagePhase>>({});
  const queue = photos.pending;
  const current = queue.find((photo) => photo.id === selected) ?? queue[0];
  if (!current) return null;
  const rest = queue.filter((photo) => photo !== current);
  const report = (id: string) => (phase: PhotoImagePhase) =>
    setOriginals((known) => (known[id] === phase ? known : { ...known, [id]: phase }));
  const row = (id: string) => ({
    categories,
    photos,
    confirming: confirm === id,
    onConfirmChange,
    phase: originals[id],
    onPhaseChange: report(id),
  });
  return (
    <div className="flex flex-col gap-4">
      <WaitingReview
        key={current.id}
        photo={current}
        position={{ index: queue.indexOf(current) + 1, total: queue.length }}
        {...row(current.id)}
      />
      {rest.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rest.map((photo) => (
            <WaitingMini
              key={photo.id}
              photo={photo}
              onOpen={() => {
                setSelected(photo.id);
                onConfirmChange(null);
              }}
              {...row(photo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

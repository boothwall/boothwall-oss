import type { PhotoDTO } from "@boothwall/shared";
import { Button } from "@boothwall/web-ui";

import { deskCopy, FOCUS_LIFT } from "@/features/control/constants";
import type { ControlPhotos } from "@/features/control/hooks";
import { photoCaption } from "@/features/control/utils";

import { ConfirmRemove } from "./ConfirmRemove";

const copy = deskCopy.review;

/** Every approved photo, 50 at a time, each removable after a confirmation. */
export function OnWallList({
  photos,
  confirm,
  onConfirmChange,
}: {
  photos: ControlPhotos;
  confirm: string | null;
  onConfirmChange: (id: string | null) => void;
}) {
  const remove = (photo: PhotoDTO) =>
    void photos.act(photo, "remove").then((done) => done && onConfirmChange(null));
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {photos.approved.map((photo) => (
          <li
            key={photo.id}
            className="flex flex-col gap-2 rounded-control border border-line bg-surface p-2.5"
          >
            <img
              className="aspect-square w-full rounded-tile bg-canvas object-contain"
              src={photo.thumbUrl}
              alt={photoCaption(photo)}
            />
            <p className="truncate font-hand text-body font-bold">{photoCaption(photo)}</p>
            {confirm === photo.id ? (
              <ConfirmRemove
                waiting={false}
                busy={photos.busy !== null}
                onConfirm={() => remove(photo)}
                onCancel={() => onConfirmChange(null)}
              />
            ) : (
              <Button
                size="sm"
                className={FOCUS_LIFT}
                disabled={photos.busy !== null}
                onClick={() => onConfirmChange(photo.id)}
              >
                {copy.remove}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {photos.cursor && (
        <Button
          className={FOCUS_LIFT}
          disabled={photos.busy !== null}
          onClick={() => void photos.more()}
        >
          {copy.more}
        </Button>
      )}
    </div>
  );
}

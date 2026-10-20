import type { ControlEvent, WallId } from "@boothwall/shared";

import type { AppBindings } from "@/contracts/runtime";
import { createDb } from "@/db/client";
import { photoService } from "@/modules/photo";
import { wallService } from "@/modules/wall";

export const createPhotoReviewEffects = ({
  bindings,
  wallId,
  origin,
  sharedEventOrigin,
}: {
  bindings: Pick<AppBindings, "DB" | "PHOTOS" | "WALL" | "ADMIN_TOKEN">;
  wallId: WallId;
  origin: string;
  sharedEventOrigin?: string;
}) => {
  const deps = {
    db: createDb(bindings.DB),
    wallId,
    bucket: bindings.PHOTOS,
    wall: wallService.broadcaster(bindings.WALL, wallId),
    origin,
    sharedEventOrigin,
    signingKey: bindings.ADMIN_TOKEN,
  };
  const control = wallService.controlNotifier(bindings.WALL, wallId);
  return {
    approvePending: (photoId: string) => photoService.approvePending(deps, photoId),
    notify: (event: ControlEvent) => control.notify(event),
  };
};

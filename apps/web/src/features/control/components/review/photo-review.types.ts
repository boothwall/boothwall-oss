import type { Category, PhotoDTO } from "@boothwall/shared";

import type { ControlPhotos } from "@/features/control/hooks";

/** The review card's two lists: waiting for a decision, or already on the wall. */
export type PhotoView = "pending" | "approved";

/** What every waiting or approved photo row needs to decide on it. */
export type PhotoRowProps = {
  photo: PhotoDTO;
  categories: readonly Category[];
  photos: ControlPhotos;
  /** The photo whose removal is being confirmed, if any. */
  confirming: boolean;
  onConfirmChange: (id: string | null) => void;
};

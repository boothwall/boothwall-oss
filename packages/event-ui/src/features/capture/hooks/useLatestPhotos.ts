import type { PhotoDTO } from "@boothwall/shared";
import { useEffect, useState } from "react";

import { fetchLatestPhotos } from "#features/capture/data";
import { useEventRuntime } from "#runtime";

export type LatestPhotos = {
  photos: PhotoDTO[];
  /** True once the request settled, even if it failed (then `photos` stays empty). */
  loaded: boolean;
};

/** A few of the newest photos on the wall. */
export function useLatestPhotos(limit: number): LatestPhotos {
  const { transport } = useEventRuntime();
  const [state, setState] = useState<LatestPhotos>({ photos: [], loaded: false });
  useEffect(() => {
    let cancelled = false;
    fetchLatestPhotos(transport, limit)
      .then((photos) => !cancelled && setState({ photos, loaded: true }))
      .catch(() => !cancelled && setState({ photos: [], loaded: true }));
    return () => {
      cancelled = true;
    };
  }, [limit, transport]);
  return state;
}

import {
  DEFAULT_SETTINGS,
  type PhotoDTO,
  type Tribe,
  type WallPhotoEvent,
  type WallSnapshotDTO,
  type WallStatsDTO,
} from "@boothwall/shared";

import { demoPhotos } from "./demoPhotos";

const CATEGORY_IDS: Tribe[] = DEFAULT_SETTINGS.categories.map((category) => category.id);

/** For demo photos whose category isn't in the config: earlier categories get more photos. */
const WEIGHTED_CATEGORIES = CATEGORY_IDS.flatMap((id, index) =>
  Array<Tribe>(CATEGORY_IDS.length - index).fill(id),
);

let counter = 0;

function simulatedPhoto(minutesAgo = 0): PhotoDTO {
  counter += 1;
  const pool = demoPhotos();
  const demo = pool[counter % pool.length];
  const fallback =
    WEIGHTED_CATEGORIES[(counter * 7) % WEIGHTED_CATEGORIES.length] ?? (CATEGORY_IDS[0] as Tribe);
  const tribe = demo && CATEGORY_IDS.includes(demo.category) ? demo.category : fallback;
  return {
    id: `sim-${counter}`,
    status: "approved",
    caption: demo?.caption ?? null,
    tribe,
    imageUrl: demo?.full ?? "",
    thumbUrl: demo?.thumb ?? "",
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    // A spread of made-up highlight scores, so demo mode has AI picks too.
    highlight: ((counter * 37) % 50) / 100 + 0.45,
  };
}

function statsFor(photos: PhotoDTO[]): WallStatsDTO {
  const byTribe: WallStatsDTO["byTribe"] = {};
  for (const photo of photos) byTribe[photo.tribe] = (byTribe[photo.tribe] ?? 0) + 1;
  return { total: photos.length, byTribe };
}

export function simulatedSnapshot(count: number): WallSnapshotDTO {
  const photos = Array.from({ length: count }, (_, i) => simulatedPhoto(count - i)).reverse();
  return { photos, stats: statsFor(photos), settings: DEFAULT_SETTINGS };
}

export function startSimulatedEvents(
  initial: PhotoDTO[],
  everyMs: number,
  emit: (event: WallPhotoEvent) => void,
): () => void {
  // Running totals rather than a list of every photo: a demo left on all day must not grow.
  const stats = statsFor(initial);
  const timer = setInterval(() => {
    const photo = simulatedPhoto();
    stats.total += 1;
    stats.byTribe[photo.tribe] = (stats.byTribe[photo.tribe] ?? 0) + 1;
    emit({
      type: "photo.created",
      photo,
      stats: { total: stats.total, byTribe: { ...stats.byTribe } },
    });
  }, everyMs);
  return () => clearInterval(timer);
}

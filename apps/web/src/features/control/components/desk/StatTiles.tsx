import type { PhotoStatsDTO } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";

import { controlCopy } from "@/features/control/constants";

const copy = controlCopy.stats;

/** On the wall, waiting and sent today, from the API's live numbers. */
export function StatTiles({ stats }: { stats: PhotoStatsDTO | null }) {
  const tiles = [
    { label: copy.onWall, value: stats?.onWall, hot: false },
    { label: copy.waiting, value: stats?.pending, hot: true },
    { label: copy.today, value: stats?.uploadsToday, hot: false },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col-reverse rounded-card border border-line bg-surface px-4 py-3.5"
        >
          <dt className="text-label text-ink-subtle">{tile.label}</dt>
          <dd
            className={cn(
              "text-display font-bold lg:text-title",
              tile.hot && tile.value ? "text-primary-text" : "text-ink",
            )}
          >
            {tile.value ?? copy.unknown}
          </dd>
        </div>
      ))}
    </dl>
  );
}

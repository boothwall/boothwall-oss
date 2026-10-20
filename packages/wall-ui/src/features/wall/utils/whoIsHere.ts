import type { Category, PhotoDTO, WallStatsDTO } from "@boothwall/shared";

export type CrowdRow = {
  id: string;
  label: string;
  count: number;
  /** The category's newest photos on the wall, newest first, for the little stack. */
  photos: PhotoDTO[];
  /** The catch-all ("Just visiting"): listed, never the leader. */
  neutral: boolean;
};

export type CrowdRanking = { rows: CrowdRow[]; more: number };

/**
 * Who's here, for the side panel: the categories with photos, most first (the catch-all after
 * the rest), each with its newest few photos. Up to `maxRows`; the others are counted in `more`.
 */
export function rankCrowd(
  categories: readonly Category[],
  stats: WallStatsDTO,
  pool: readonly PhotoDTO[],
  { maxRows, thumbs }: { maxRows: number; thumbs: number },
): CrowdRanking {
  const newestFirst = [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ranked = categories
    .map(({ id, label, catchAll }) => ({
      id,
      label,
      count: stats.byTribe[id] ?? 0,
      neutral: catchAll === true,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => Number(a.neutral) - Number(b.neutral) || b.count - a.count);
  const rows = ranked.slice(0, maxRows).map((row) => ({
    ...row,
    photos: newestFirst.filter((photo) => photo.tribe === row.id).slice(0, thumbs),
  }));
  return { rows, more: ranked.length - rows.length };
}

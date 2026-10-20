import { REPO_URL } from "@/config";

export type BadgeChipProps = { label: string };

/** The config's `badge` in the phone header, linking to the source. */
export function BadgeChip({ label }: BadgeChipProps) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label}, source on GitHub`}
      className="shrink-0 rounded-pill bg-primary px-2.5 py-1 whitespace-nowrap text-2xs font-extrabold tracking-caps text-on-primary uppercase transition hover:brightness-110"
    >
      {label}
    </a>
  );
}

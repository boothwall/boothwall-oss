import { GitHubIcon } from "#brand";

export type SourceFooterProps = {
  /** The source repository. */
  href: string;
  /** Shown next to the GitHub mark, usually the author's handle. */
  handle: string;
  /** A small line under the link. */
  tagline?: string;
};

/**
 * A quiet credit: the GitHub mark, a handle and an optional line. PageShell renders it only when
 * a page opts in with its `source` prop.
 */
export function SourceFooter({ href, handle, tagline }: SourceFooterProps) {
  return (
    <footer className="mt-10 flex flex-col items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Source on GitHub by ${handle}`}
        className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-ui font-semibold text-ink-muted transition hover:bg-surface hover:text-ink"
      >
        <GitHubIcon className="size-5 text-ink" />
        {handle}
      </a>
      {tagline && <p className="text-center text-label text-ink-subtle">{tagline}</p>}
    </footer>
  );
}

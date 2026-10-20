import type { ReactNode } from "react";

export type PreviewSectionProps = { title: string; note?: string; children: ReactNode };

export function PreviewSection({ title, note, children }: PreviewSectionProps) {
  return (
    <section className="border-t border-line py-10 first:border-t-0">
      <h2 className="text-title font-bold">{title}</h2>
      {note && <p className="mt-1 text-ui text-ink-muted">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

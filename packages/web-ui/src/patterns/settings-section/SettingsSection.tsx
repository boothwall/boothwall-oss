import type { ReactNode } from "react";

import { cn } from "#foundations";

export type SettingsSectionProps = {
  title: string;
  /** Rows go in a bordered card; pickers that bring their own cards set this to false. */
  boxed?: boolean;
  children: ReactNode;
};

/** A titled group of settings. */
export function SettingsSection({ title, boxed = true, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-ui font-semibold text-ink-muted">{title}</h2>
      <div className={cn(boxed && "rounded-card border border-line bg-surface px-4 py-3")}>
        {children}
      </div>
    </section>
  );
}

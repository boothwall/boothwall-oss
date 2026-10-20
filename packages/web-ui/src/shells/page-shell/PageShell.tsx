import type { ReactNode } from "react";

import { cn } from "#foundations";

import { SourceFooter, type SourceFooterProps } from "../source-footer/SourceFooter";

export type PageShellProps = {
  children: ReactNode;
  /** Usually a BrandHeader; the app decides what it says and where it links. */
  header: ReactNode;
  /**
   * The source credit at the foot of the page. Off unless passed: guests, recaps and prints
   * don't need it, so only a page about the project itself should opt in.
   */
  source?: SourceFooterProps;
  /**
   * Phone-first either way. "wide" lets a page spread out to the page column on a laptop or
   * desktop screen (from the lg breakpoint); "phone" keeps the narrow column everywhere.
   */
  layout?: "phone" | "wide";
};

/**
 * The page frame on the canvas, on the one layout grid: the gutter on both sides, the header
 * at its fixed height, the fixed gap, then the content. Top and side gutters match, with
 * the phone's safe area added above. The logo and the content share the
 * same left edge. Every page gets the soft top light; host pages (data-surface="host") a quieter one.
 */
export function PageShell({ children, header, source, layout = "phone" }: PageShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-page-glow">
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-narrow flex-col px-gutter pt-[calc(var(--u-space-gutter)_+_env(safe-area-inset-top,0px))] pb-safe-bottom",
          layout === "wide" && "lg:max-w-page",
        )}
      >
        {header}
        <main className="flex flex-1 flex-col pt-header-gap">{children}</main>
        {source && <SourceFooter {...source} />}
      </div>
    </div>
  );
}

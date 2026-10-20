import type { ReactNode } from "react";

import { cn } from "#foundations";

export type PageContainerProps = { children: ReactNode; className?: string };

/**
 * The page column for pages that draw their own full-width bars (a sticky top bar, a hero):
 * the shared page width and the gutter on both sides, so every page lines up with PageShell.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("mx-auto w-full max-w-page px-gutter", className)}>{children}</div>;
}

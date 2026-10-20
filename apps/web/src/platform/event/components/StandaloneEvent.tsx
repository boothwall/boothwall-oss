import { EventProvider } from "@boothwall/event-ui/runtime";
import { type ReactNode, useMemo } from "react";

import { createStandaloneEventRuntime } from "../standalone-event.runtime";

export type StandaloneEventProps = {
  children: ReactNode;
  demo?: boolean;
  /**
   * The wall: it draws its own bundled logo (wall-ui `assets/brand/logo.png`) as the TV does,
   * not the phone pages' logo, which sits beside it in the split header's lockup.
   */
  wall?: boolean;
};

export function StandaloneEvent({ children, demo, wall = false }: StandaloneEventProps) {
  const runtime = useMemo(() => {
    const base = createStandaloneEventRuntime(() => "");
    const shown = wall
      ? { ...base, presentation: { ...base.presentation, logoUrl: undefined } }
      : base;
    return demo === undefined ? shown : { ...shown, scopeKey: `${shown.scopeKey}:${demo}`, demo };
  }, [demo, wall]);
  return <EventProvider runtime={runtime}>{children}</EventProvider>;
}

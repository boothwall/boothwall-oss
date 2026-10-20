import { BADGE_LABEL, EVENT, type WallSettings } from "@boothwall/shared";
import { Button, cn } from "@boothwall/web-ui";
import { Lock } from "lucide-react";

import { BadgeChip } from "@/components/brand/BadgeChip";
import { controlCopy, FOCUS_LIFT } from "@/features/control/constants";

import { DeskBrand } from "../primitives";
import { OpenWallLink } from "./OpenWallLink";

const copy = controlCopy.bar;

/** The desk's top bar: the brand, which event this is, what's live, the wall and Lock. */
export function DeskBar({
  settings,
  onLock,
}: {
  settings: WallSettings | null;
  onLock: () => void;
}) {
  const event = settings ? `${settings.eventName} ${settings.eventYear}`.trim() : EVENT.name;
  return (
    <header className="flex items-center gap-3 px-4 py-3.5 lg:gap-4 lg:border-b lg:border-line lg:bg-canvas/70 lg:px-7 lg:backdrop-blur-sm">
      <DeskBrand className="h-5.5 w-auto lg:h-7.5" />
      {BADGE_LABEL && <BadgeChip label={BADGE_LABEL} />}
      <span aria-hidden className="h-7 w-px bg-line max-lg:hidden" />
      <div className="flex min-w-0 flex-col max-lg:sr-only">
        <h1 className="text-lg leading-tight font-bold">{controlCopy.title}</h1>
        <span className="truncate text-label text-ink-subtle">{event}</span>
      </div>
      <span className="flex-1" />
      {settings && (
        <div className="flex gap-2 max-lg:hidden">
          <StatusChip on={!settings.playbackPaused}>
            {settings.playbackPaused ? copy.paused : copy.playing}
          </StatusChip>
          <StatusChip on={settings.uploadsOpen}>
            {settings.uploadsOpen ? copy.open : copy.closed}
          </StatusChip>
        </div>
      )}
      <OpenWallLink />
      <Button
        size="sm"
        aria-label={copy.lockName}
        onClick={onLock}
        className={cn(FOCUS_LIFT, "max-lg:w-9 max-lg:px-0")}
      >
        <Lock aria-hidden className="size-4" strokeWidth={1.8} />
        <span className="max-lg:sr-only">{copy.lock}</span>
      </Button>
    </header>
  );
}

function StatusChip({ on, children }: { on: boolean; children: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-pill border border-line bg-surface px-3 text-label font-medium whitespace-nowrap text-ink-muted">
      <span aria-hidden className={cn("size-2 rounded-pill", on ? "bg-success" : "bg-waiting")} />
      {children}
    </span>
  );
}

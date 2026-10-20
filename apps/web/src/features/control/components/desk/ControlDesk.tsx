import { EventApiError, useEventRuntime } from "@boothwall/event-ui/runtime";
import { DEFAULT_SETTINGS, type PhotoDTO } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";
import { useCallback, useState } from "react";

import { WIDE_QUERY } from "@/config";
import { controlCopy, type ControlTab, deskCopy } from "@/features/control/constants";
import {
  useControlPhotos,
  useControlStats,
  useControlTab,
  useRuntimeControls,
  useTvRequest,
} from "@/features/control/hooks";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

import { GuestLink } from "../guests";
import { LiveSwitches, TvActions, WallPreview } from "../live";
import { ControlNotice, DeskCard } from "../primitives";
import { OnWallStrip, PhotoReview, type PhotoView } from "../review";
import { DeskBar } from "./DeskBar";
import { FailureBanner } from "./FailureBanner";
import { PhoneTabBar } from "./PhoneTabBar";
import { StatTiles } from "./StatTiles";

/**
 * The Booth desk: the queue and the numbers on the left, the wall, its switches, the screen
 * requests and the invite on the right. A phone shows one of Review, Live and Guests at a time,
 * each at its own address; the wall preview only runs where it can be seen.
 */
export function ControlDesk({
  onAccessError,
  onLock,
}: {
  onAccessError: (error: EventApiError) => boolean;
  onLock: () => void;
}) {
  const runtime = useEventRuntime();
  const [error, setError] = useState<string | null>(null);
  const onFailure = useCallback(
    (failure: unknown) => {
      if (failure instanceof EventApiError && onAccessError(failure)) return;
      setError(controlCopy.failure.reach);
    },
    [onAccessError],
  );
  const onSuccess = useCallback(() => setError(null), []);
  const photos = useControlPhotos(onFailure, onSuccess);
  const live = useRuntimeControls(onFailure, onSuccess);
  const stats = useControlStats(onAccessError);
  const photoCall = useTvRequest("photocall", onFailure, onSuccess);
  const hints = useTvRequest("hints", onFailure, onSuccess);
  const theme = useTvRequest("theme", onFailure, onSuccess);
  const { tab, open } = useControlTab();
  const wide = useMediaQuery(WIDE_QUERY);
  const [view, setView] = useState<PhotoView>("pending");
  const categories = live.settings?.categories ?? DEFAULT_SETTINGS.categories;
  const onWall = stats.stats?.onWall ?? null;
  // A decision changes the numbers, so they follow it rather than the next 5 s poll.
  const decide = {
    ...photos,
    act: async (photo: PhotoDTO, action: "approve" | "remove") => {
      const done = await photos.act(photo, action);
      if (done) void stats.refresh();
      return done;
    },
  };
  const retry = () => {
    setError(null);
    void photos.refresh();
    void stats.refresh();
    live.retry();
  };
  const onPhone = (shown: ControlTab) => (tab === shown ? "" : "max-lg:hidden");
  return (
    <div className="min-h-dvh bg-page-glow pb-28 lg:pb-8">
      <DeskBar settings={live.settings} onLock={onLock} />
      <main className="mx-auto grid max-w-wide grid-cols-1 gap-3.5 px-4 lg:grid-cols-12 lg:gap-6 lg:px-7 lg:pt-6">
        {(error || live.failed) && (
          <div className="lg:col-span-12">
            <FailureBanner message={error ?? controlCopy.failure.live} onRetry={retry} />
          </div>
        )}
        <div
          className={cn(
            "flex min-w-0 flex-col gap-3.5 lg:col-span-7 lg:gap-4.5",
            onPhone("review"),
          )}
        >
          <StatTiles stats={stats.stats} />
          <PhotoReview
            photos={decide}
            categories={categories}
            view={view}
            onViewChange={setView}
            onWall={onWall}
          />
          <OnWallStrip
            photos={photos}
            onWall={onWall}
            onSeeAll={() => {
              setView("approved");
              document.getElementById("photo-review")?.scrollIntoView?.({ behavior: "smooth" });
            }}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-3.5 lg:col-span-5 lg:gap-4.5">
          <div className={cn("flex flex-col gap-3.5 lg:gap-4.5", onPhone("live"))}>
            <DeskCard title={deskCopy.preview.title} note={deskCopy.preview.note} phone="untitled">
              {(wide || tab === "live") && <WallPreview />}
              <p className="text-label text-ink-subtle max-lg:hidden">{deskCopy.preview.help}</p>
            </DeskCard>
            <DeskCard title={deskCopy.live.title} phone="untitled">
              <LiveSwitches settings={live.settings} busy={live.busy} onSave={live.save} />
            </DeskCard>
            <DeskCard title={deskCopy.tv.title} note={deskCopy.tv.note} phone="bare">
              <TvActions photoCall={photoCall} hints={hints} theme={theme} />
            </DeskCard>
          </div>
          <div className={onPhone("guests")}>
            <GuestLink path={runtime.links.snap} />
          </div>
        </div>
      </main>
      <ControlNotice className="mx-auto max-w-wide px-4 pt-6 text-center lg:px-7" />
      <PhoneTabBar current={tab} waiting={photos.pending.length} onOpen={open} />
    </div>
  );
}

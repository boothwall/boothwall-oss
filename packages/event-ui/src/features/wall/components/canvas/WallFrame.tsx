import type { WallLook, WallTheme } from "@boothwall/shared";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type FeedStatus,
  nextTheme,
  PixelDensityProvider,
  type RemoteInputHook,
  WallErrorBoundary,
  WallScreen,
} from "@boothwall/wall-ui";
import { cn } from "@boothwall/web-ui";
import { useMemo, useRef, useState } from "react";

import { WallMoments } from "#features/wall/components/moments";
import { CANVAS_EDGE_FEATHER } from "#features/wall/constants";
import type { WallMomentsState } from "#features/wall/hooks";
import { useCanvasScale } from "#features/wall/hooks";
import { useDevicePixelRatio } from "#features/wall/hooks";
import { useKeyboardRemote } from "#features/wall/hooks";
import { wallCopyWith } from "#features/wall/utils";
import { useEventRuntime } from "#runtime";

export interface WallFrameProps {
  demo: boolean;
  /**
   * The keyboard drives the wall by default (arrows, Enter). A page with its own shortcuts,
   * like the Control panel's live preview, passes a remote that ignores every key.
   */
  useRemoteInput?: RemoteInputHook;
  /** Told when the wall's connection changes. */
  onStatusChange?: (status: FeedStatus) => void;
  /** The theme to start on instead of the configured one (`?theme=`). */
  theme?: WallTheme;
  /** The wall's optional looks (`wall` in boothwall.config.ts); the classic look without. */
  look?: WallLook;
  /** The photo call and the remote help card, when the page answers those requests itself. */
  moments?: WallMomentsState | null;
  className?: string;
}

const edgeMask = (spare: "x" | "y", feather: string) =>
  `linear-gradient(${spare === "x" ? "to right" : "to bottom"}, transparent, black ${feather}, black calc(100% - ${feather}), transparent)`;

/**
 * The TV's 960×540 canvas, scaled as one piece to fill this element, the way Vega scales it
 * to 1080p. The wall is a flat tone, so the element takes the same tone: a box that isn't
 * 16:9 shows no bars, and the canvas edge fades into identical colour.
 *
 * Scaled with `zoom`, not a transform: the browser lays the canvas out at its final size and
 * draws text and photos at the screen's resolution. A transformed canvas is drawn at 960×540
 * and stretched (Safari keeps that small bitmap, so the whole wall blurs). The wall is told the
 * resulting density, so its photos load a copy with enough pixels.
 */
export function WallFrame({
  demo,
  useRemoteInput = useKeyboardRemote,
  onStatusChange,
  theme: startTheme,
  look,
  moments,
  className,
}: WallFrameProps) {
  const runtime = useEventRuntime();
  const { wallWords } = runtime.presentation;
  const copy = useMemo(() => wallWords && wallCopyWith(wallWords), [wallWords]);
  // "Next theme" in Control steps the theme here until the page reloads; nothing is saved.
  const [theme, setTheme] = useState(startTheme);
  const connection = useMemo(
    () => ({
      apiBaseUrl: runtime.wall.apiBaseUrl,
      target: runtime.wall.target,
      joinUrl: new URL(runtime.links.snap, window.location.href).toString(),
      recapUrl: runtime.links.recap
        ? new URL(runtime.links.recap, window.location.href).toString()
        : undefined,
      presentation: {
        ...runtime.presentation,
        logoUrl: runtime.presentation.logoUrl
          ? new URL(runtime.presentation.logoUrl, window.location.origin).toString()
          : runtime.presentation.logoUrl,
        backdropUrl: runtime.presentation.backdropUrl
          ? new URL(runtime.presentation.backdropUrl, window.location.origin).toString()
          : runtime.presentation.backdropUrl,
      },
      sourceUrl: runtime.presentation.sourceUrl,
      sourceLabel: runtime.presentation.sourceLabel,
      showSource: runtime.presentation.showSourceOnWall,
      badge: runtime.presentation.badge,
      venue: runtime.presentation.venue,
      storageNamespace: JSON.stringify([
        new URL(runtime.wall.apiBaseUrl).origin,
        runtime.wall.target.wallId,
      ]),
      initialSettings: runtime.defaults,
    }),
    [runtime],
  );
  const box = useRef<HTMLDivElement>(null);
  const { scale, spare } = useCanvasScale(box);
  const ratio = useDevicePixelRatio();

  return (
    // The wall is a guest surface wherever it shows, even inside the host's Control panel.
    <div
      ref={box}
      data-surface="public"
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-canvas",
        className,
      )}
    >
      <div
        className="relative flex shrink-0 flex-col"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          zoom: scale,
          maskImage: edgeMask(spare, CANVAS_EDGE_FEATHER),
        }}
      >
        <PixelDensityProvider value={scale * ratio}>
          <WallErrorBoundary>
            <WallScreen
              connection={connection}
              useRemoteInput={useRemoteInput}
              demo={demo}
              onStatusChange={onStatusChange}
              theme={theme}
              look={look}
              copy={copy}
              onThemeRequest={(shown) => setTheme(nextTheme(shown))}
              {...moments?.requests}
              overlay={
                moments && (
                  <WallMoments
                    moments={moments}
                    demo={demo}
                    look={look}
                    joinUrl={connection.joinUrl}
                  />
                )
              }
            />
          </WallErrorBoundary>
        </PixelDensityProvider>
      </div>
    </div>
  );
}

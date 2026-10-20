import type { WallLook, WallTheme } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";
import { useMemo } from "react";

import { SnapButton } from "#features/wall/components/canvas";
import { PortraitWallPrompt } from "#features/wall/components/canvas";
import { FullscreenHint } from "#features/wall/components/canvas";
import { WallFrame } from "#features/wall/components/canvas";
import { COARSE_POINTER_QUERY } from "#features/wall/constants";
import { PORTRAIT_HANDHELD_QUERY } from "#features/wall/constants";
import { HINT_VISIBLE_MS } from "#features/wall/constants";
import { useFullscreen } from "#features/wall/hooks";
import { useIdleCursor } from "#features/wall/hooks";
import { useMomentInput } from "#features/wall/hooks";
import { useTimedFlag } from "#features/wall/hooks";
import { useWallMoments } from "#features/wall/hooks";
import { useWallParams } from "#features/wall/hooks";
import { useMediaQuery } from "#lib/hooks";
import { EventProvider, useEventRuntime } from "#runtime";

/**
 * The TV wall in a browser, rendered through react-native-web. Like the TV, it runs live or on
 * the bundled demo photos as boothwall.config.ts says; `?demo` forces the demo and `?theme=party`
 * starts on that built-in theme. It fills the window (WallFrame). F or a double-click toggles
 * full screen; `?kiosk` hides the hint, cursor and phone button, and `?fullscreen` also goes full
 * screen on the first key press or click. Phones get an "Add your photo" button, and every
 * viewport keeps the same display role. `look` dresses the wall (`wall` in boothwall.config.ts);
 * without it the wall keeps its classic look. When the runtime offers them (`wallMoments`), the
 * host's phone can run a photo call and show the remote's help card here, as on the TV.
 */
export function BrowserWallExperience({ look }: { look?: WallLook }) {
  const params = useWallParams();
  const runtime = useEventRuntime();
  const demo = params.demo || runtime.demo;
  const scoped = useMemo(
    () => ({ ...runtime, demo, scopeKey: `${runtime.scopeKey}:display:${demo}` }),
    [runtime, demo],
  );
  return (
    <EventProvider runtime={scoped}>
      <WallContent params={params} demo={demo} look={look} />
    </EventProvider>
  );
}

function WallContent({
  params,
  demo,
  look,
}: {
  params: ReturnType<typeof useWallParams>;
  demo: boolean;
  look?: WallLook;
}) {
  const phone = useMediaQuery(COARSE_POINTER_QUERY);
  const portrait = useMediaQuery(PORTRAIT_HANDHELD_QUERY);
  if (phone && portrait) return <PortraitWallPrompt kiosk={params.kiosk} />;
  return (
    <CanvasWall
      kiosk={params.kiosk}
      autoFullscreen={params.autoFullscreen}
      demo={demo}
      theme={params.theme}
      look={look}
      phone={phone}
    />
  );
}

interface CanvasWallProps {
  kiosk: boolean;
  autoFullscreen: boolean;
  demo: boolean;
  theme?: WallTheme;
  look?: WallLook;
  /** A touch-first device: show the "Add your photo" button instead of the hint. */
  phone: boolean;
}

/** The wall filling the window. */
function CanvasWall({ kiosk, autoFullscreen, demo, theme, look, phone }: CanvasWallProps) {
  const fullscreen = useFullscreen(autoFullscreen);
  const hintVisible = useTimedFlag(HINT_VISIBLE_MS, !kiosk);
  const hideCursor = useIdleCursor(kiosk);
  const moments = useWallMoments(useEventRuntime().wallMoments, !phone);
  useMomentInput(moments);

  return (
    <main
      className={cn(
        "fixed inset-0 bg-canvas",
        phone && !kiosk && "pb-[calc(3.5rem_+_max(1rem,env(safe-area-inset-bottom)))]",
        hideCursor && "cursor-none",
      )}
    >
      <WallFrame demo={demo} theme={theme} look={look} moments={moments} className="size-full" />
      {!kiosk && (phone ? <SnapButton /> : <FullscreenHint visible={hintVisible && !fullscreen} />)}
    </main>
  );
}

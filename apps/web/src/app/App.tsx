import { applySurface } from "@boothwall/web-ui";
import { lazy, StrictMode, Suspense } from "react";

import { resolveRoute, routeOf, surfaceFor } from "@/app/routes";
import { appPath, SNAP_PATH, WALL_PATH } from "@/config";
import { CapturePage } from "@/features/capture";
import { ControlPage } from "@/features/control";

const WallPage = lazy(() =>
  import("@/features/wall").then(({ WallPage }) => ({ default: WallPage })),
);

export function App() {
  const route = resolveRoute(routeOf(window.location.pathname));
  if (route.redirectTo)
    history.replaceState(
      null,
      "",
      `${appPath(route.redirectTo)}${window.location.search}${window.location.hash}`,
    );
  applySurface(surfaceFor(route.screen));
  // Animated wall rendering does not use the development-only StrictMode remount.
  if (route.screen === "wall")
    return (
      <Suspense fallback={null}>
        <WallPage />
      </Suspense>
    );
  return (
    <StrictMode>
      {route.screen === "control" ? (
        <ControlPage />
      ) : route.screen === "snap" ? (
        <CapturePage />
      ) : (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
          <h1 className="text-title font-bold">Page not found</h1>
          <p>This wall has a display, a photo upload page and a Control panel.</p>
          <a className="underline" href={appPath(WALL_PATH)}>
            Open the wall
          </a>
          <a className="underline" href={appPath(SNAP_PATH)}>
            Send a photo
          </a>
        </main>
      )}
    </StrictMode>
  );
}

import {
  APP_BASE,
  CONTROL_GUESTS_PATH,
  CONTROL_LIVE_PATH,
  CONTROL_PATH,
  SNAP_PATH,
} from "@/config";

export type Screen = "wall" | "snap" | "control" | "not-found";
export type Route = { screen: Screen; redirectTo?: string };

/**
 * The route inside the app: the address without the base path it is served under. An address
 * outside the base matches no route.
 */
export function routeOf(pathname: string, base = APP_BASE): string {
  if (base === "/") return pathname;
  const lower = pathname.toLowerCase();
  const root = base.slice(0, -1).toLowerCase();
  if (lower === root) return "/";
  return lower.startsWith(`${root}/`) ? pathname.slice(root.length) : "";
}

const CONTROL_PATHS = [CONTROL_PATH, CONTROL_LIVE_PATH, CONTROL_GUESTS_PATH];

/** Preserve old display/operator bookmarks, but never turn an unknown URL into a wall. */
export function resolveRoute(pathname: string): Route {
  const lower = pathname.toLowerCase();
  const clean = lower === "/" ? "/" : lower.replace(/\/+$/, "");
  const path = /^\/admin(?:\/|$)/.test(clean)
    ? CONTROL_PATH
    : /^\/wall(?:\/|$)/.test(clean)
      ? "/"
      : clean;
  const screen: Screen =
    path === "/"
      ? "wall"
      : path === SNAP_PATH
        ? "snap"
        : CONTROL_PATHS.includes(path)
          ? "control"
          : "not-found";
  return path === pathname || screen === "not-found" ? { screen } : { screen, redirectTo: path };
}
export function surfaceFor(screen: Screen): "public" | "host" {
  return screen === "control" ? "host" : "public";
}

import { DEFAULT_WALL_ID, type WallId } from "../identity/wall-id.schemas.ts";

/** Which wall a screen shows. The open edition's screens have no token. */
export type WallTarget = { wallId: WallId; screenToken?: string };

export const DEFAULT_WALL_TARGET: WallTarget = { wallId: DEFAULT_WALL_ID };

/**
 * Query parameters a paired screen adds to every request and to the realtime socket (a browser
 * socket can't send headers). A host's wall resolver reads them; the open API ignores them.
 */
export const WALL_SCOPE_PARAMS = { wallId: "wall", screenToken: "screen" } as const;

/** `url` scoped to `target`. The default wall's URLs stay exactly as they are. */
export function scopeToWall(url: string, target: WallTarget): string {
  const params: [string, string][] = [];
  if (target.wallId !== DEFAULT_WALL_ID) params.push([WALL_SCOPE_PARAMS.wallId, target.wallId]);
  if (target.screenToken) params.push([WALL_SCOPE_PARAMS.screenToken, target.screenToken]);
  if (params.length === 0) return url;
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

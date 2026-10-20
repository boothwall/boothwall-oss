export type FeedStatus = "connecting" | "live" | "offline" | "simulated";

export type ConnectionPhase = "connecting" | "loading" | "failed" | "ready";

/** What the start-up overlay shows. Once the first snapshot is in, later drops only touch the status pill. */
export function connectionPhase(status: FeedStatus, loaded: boolean): ConnectionPhase {
  if (loaded || status === "simulated") return "ready";
  if (status === "offline") return "failed";
  if (status === "live") return "loading";
  return "connecting";
}

/**
 * The wall is up but can't refresh: it runs on a saved wall before the API answered, or on what
 * it had before the link dropped. Demo mode never is.
 */
export const isShowingStale = (status: FeedStatus, loaded: boolean, liveLoaded: boolean) =>
  loaded && (status === "offline" || !liveLoaded);

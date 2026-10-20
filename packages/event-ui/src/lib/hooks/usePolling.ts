import { useEffect } from "react";

/**
 * Runs `poll` now and then every `everyMs` while `enabled`, but only while the page is in view:
 * a phone in a pocket stops polling, and coming back polls straight away.
 */
export function usePolling(poll: () => void, everyMs: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => clearInterval(timer);
    const start = () => {
      stop();
      poll();
      timer = setInterval(poll, everyMs);
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? stop() : start());
    if (document.visibilityState !== "hidden") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, everyMs, poll]);
}

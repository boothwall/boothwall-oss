import { type CaptionStyle, type Category, type EventPresentation } from "@boothwall/shared";
import { useEffect, useState } from "react";

import { createSettingsClient } from "#features/settings";
import { useEventRuntime } from "#runtime";

export type UploadSettings = {
  presentation?: EventPresentation;
  eventName: string;
  open: boolean;
  closedMessage: string;
  categories: readonly Category[];
  /** So previews of the visitor's photo look like the card on the wall. */
  captionStyle: CaptionStyle;
  /** Shown once the photo is sent. */
  hashtag: string;
};

/**
 * What the hosts allow right now (whether uploads are open, which categories to offer) and
 * the caption style and hashtag for previews.
 * Uses the config defaults until the live settings arrive (or if they can't be read); the API
 * checks both again on upload.
 */
export function useUploadSettings(): UploadSettings {
  const { transport, defaults } = useEventRuntime();
  const [state, setState] = useState<UploadSettings>({
    eventName: defaults.eventName,
    presentation: defaults.presentation,
    open: defaults.uploadsOpen && !defaults.eventEnded,
    closedMessage: defaults.uploadsClosedMessage,
    categories: defaults.categories,
    captionStyle: defaults.captionStyle,
    hashtag: defaults.eventHashtag,
  });
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      createSettingsClient(transport)
        .fetchSettings()
        .then((settings) => {
          if (cancelled) return;
          setState({
            eventName: settings.eventName,
            presentation: settings.presentation,
            open: settings.uploadsOpen && !settings.eventEnded,
            closedMessage: settings.uploadsClosedMessage,
            categories: settings.categories,
            captionStyle: settings.captionStyle,
            hashtag: settings.eventHashtag,
          });
        })
        .catch(() => undefined);
    // Again when the visitor comes back to the tab: the hosts may have changed something.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [transport]);
  return state;
}

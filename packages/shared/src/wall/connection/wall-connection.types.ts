import type { EventPresentation, WallSettings } from "#settings";

import type { WallTarget } from "../target/wall-target.schemas.ts";

/** All event-specific inputs needed by a display, independent of its application shell. */
export type WallConnection = {
  apiBaseUrl: string;
  target: WallTarget;
  joinUrl: string;
  recapUrl?: string;
  sourceUrl: string;
  sourceLabel: string;
  showSource: boolean;
  presentation?: EventPresentation;
  badge?: string;
  venue?: string;
  storageNamespace: string;
  initialSettings: WallSettings;
};

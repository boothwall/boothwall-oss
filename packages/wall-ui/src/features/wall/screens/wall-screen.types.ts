import type { PhotoDTO, WallConnection, WallLook, WallTarget, WallTheme } from "@boothwall/shared";
import type { ReactNode } from "react";

import type { WallCopy } from "#copy";
import type { RemoteInputHook } from "#platform/input";
import type { KeyValueStore } from "#platform/storage";

import type { FeedStatus } from "../state/connectionPhase";
import type { WallDisplaySource } from "../types";

export type WallScreenProps = {
  /** The platform's remote input (see RemoteInputHook). */
  useRemoteInput: RemoteInputHook;
  /** Run on the bundled demo photos whatever boothwall.config.ts says. */
  demo?: boolean;
  source?: WallDisplaySource;
  /** Which wall to show; the open edition's one wall by default. */
  onAccessRevoked?: () => void;
  /**
   * Device storage for the last live wall, so a restart without network still shows photos.
   * Without one the wall works as before, it just starts empty when offline.
   */
  store?: KeyValueStore;
  /** Told whenever the feed's connection changes, e.g. for a "live" dot beside a preview. */
  onStatusChange?: (status: FeedStatus) => void;
  /** Playback pause owned by the host, e.g. a remote command. When set it wins over settings. */
  paused?: boolean;
  /** Told when playback pauses or resumes, including from the remote's play/pause key. */
  onPausedChange?: (paused: boolean) => void;
  /** Told when a photo opens full screen (spotlight or a pick) and when it closes. */
  onSpotlightChange?: (open: boolean) => void;
  /** Told the approved photos the wall holds, newest first, whenever they change. */
  onPhotosChange?: (photos: readonly PhotoDTO[]) => void;
  /** The host's phone asked for a photo call; a TV app that offers one starts it. */
  onPhotoCallRequest?: () => void;
  /** The host's phone asked for the remote's help; a TV app that shows one does. */
  onHintsRequest?: () => void;
  /**
   * The host's phone asked for the next theme, told the one on screen. A host that offers it shows
   * the next one through `theme` (see `nextTheme`) until it restarts.
   */
  onThemeRequest?: (shown: WallTheme) => void;
  /** Shows this theme instead of the configured one, e.g. to preview the themes. */
  theme?: WallTheme;
  /**
   * The host owns Back (e.g. a TV menu): the wall leaves the hardware Back to it and only closes
   * its spotlight when the host forwards Back through `useRemoteInput`. It never arms an exit.
   */
  hostBack?: boolean;
  /** The wall's words in another language; without it the wall speaks today's English. */
  copy?: WallCopy;
  /** The wall's optional looks, like `wall` in boothwall.config.ts; the classic look without. */
  look?: WallLook;
  /**
   * The host's own layer over the whole wall, e.g. its photo call. It is drawn inside the wall's
   * theme, so it can read the live colours and settings (`useWallTheme`, `useWallSettings`).
   */
  overlay?: ReactNode;
} & ({ connection: WallConnection; wall?: never } | { connection?: undefined; wall?: WallTarget });

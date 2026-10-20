/**
 * The BoothWall wall, shared by the Vega TV app and the web. Nothing in here is
 * platform-specific: each app passes its remote input to WallScreen, and the few
 * React Native APIs that differ on the web have a `.web.ts` twin next to them.
 */
export { defaultWallCopy, useWallCopy, type WallCopy, WallCopyProvider } from "./copy";
export {
  type Finale,
  missionFor,
  type PhotoCall,
  photoCallCopy,
  PhotoCallFinale,
  PhotoCallOverlay,
  type PhotoCallOverlayProps,
  usePhotoCallState,
} from "./features/photo-call";
export {
  REMOTE_HINT_MS,
  remoteHintCopy,
  RemoteHintOverlay,
  type RemoteHintOverlayProps,
  useRemoteHintState,
} from "./features/remote-hint";
export {
  CAPTION_LOOKS,
  DEMO_PHOTO_COUNT,
  type DemoPhoto,
  demoPhotos,
  type FeedStatus,
  JOIN_VOICE,
  parseWallEvent,
  PING_MS,
  QrCode,
  type QrCodeProps,
  reconnectDelayMs,
  SignalCallBurst,
  simulatedSnapshot,
  useWallSettings,
  type WallDisplayObserver,
  type WallDisplaySource,
  WallErrorBoundary,
  WallScreen,
  type WallScreenProps,
  wallSocketUrl,
} from "./features/wall";
export { useReducedMotion } from "./foundation/motion";
export { nextTheme, UniversalPaletteProvider, useWallTheme } from "./foundation/theme";
export { PixelDensityProvider } from "./platform/display/pixelDensity";
export type { RemoteHandlers, RemoteInputHook, RemoteKey } from "./platform/input/remoteInput";
export type { KeyValueStore } from "./platform/storage/keyValueStore";
export { themeBackdropUri } from "./theme/themeArt";
export { CANVAS_HEIGHT, CANVAS_WIDTH, THEME_COLORS } from "./theme/tokens";

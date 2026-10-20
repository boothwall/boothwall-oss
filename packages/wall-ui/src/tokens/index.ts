/**
 * The package's React Native-free door (`@boothwall/wall-ui/tokens`): the theme tokens and the
 * wall's data constants the web's DOM-only pages (capture, recap, control, try) draw with.
 * Nothing in here imports a screen or a React Native component, so those bundles stay free of
 * the wall's native code. It reaches into `features/wall` for the data, which the feature's own
 * barrel can't offer without pulling WallScreen along.
 */
export { defaultWallCopy, useWallCopy, type WallCopy, WallCopyProvider } from "#copy";
export { CAPTION_LOOKS } from "#features/wall/constants/captionStyles";
export { JOIN_VOICE } from "#features/wall/constants/copy";
export { PING_MS } from "#features/wall/constants/feed";
export { parseWallEvent, reconnectDelayMs, wallSocketUrl } from "#features/wall/data/wallSocket";
export type { FeedStatus } from "#features/wall/state/connectionPhase";
export { UniversalPaletteProvider } from "#foundation/theme";
export { themeBackdropUri } from "#theme/themeArt";
export * from "#theme/tokens";

import type { WallId, WallSettings } from "@boothwall/shared";
/** Optional host policy; persistence still owns atomic compare-and-swap. */
export type SettingsValidator = (input: {
  wallId: WallId;
  settings: WallSettings;
}) => Promise<void>;

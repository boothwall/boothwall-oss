import { BUILT_IN_SETTINGS, type WallSettings, wallSettingsSchema } from "#settings";

import { boothwallConfig } from "../boothwall.config.ts";
import type { BoothwallConfig } from "../schema/boothwall-config.schemas.ts";

const fromConfig: BoothwallConfig["settings"] = (boothwallConfig as BoothwallConfig).settings;

/** Configured presentation and initial runtime flags; durable runtime records override only their flags. */
export const DEFAULT_SETTINGS: WallSettings = wallSettingsSchema.parse({
  ...BUILT_IN_SETTINGS,
  ...fromConfig,
  categories: boothwallConfig.categories,
  eventName: boothwallConfig.event.name,
  eventHashtag: boothwallConfig.event.hashtag,
  eventYear: (boothwallConfig as BoothwallConfig).event.year ?? "",
});

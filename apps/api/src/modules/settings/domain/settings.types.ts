import type { WallEvent, WallId } from "@boothwall/shared";

import type { SettingsAuthority } from "@/contracts/runtime";
import type { Db } from "@/db/client";

export type SettingsDeps = {
  settingsAuthority?: SettingsAuthority;
  db: Db;
  wallId: WallId;
  wall: { broadcast: (event: WallEvent) => Promise<void> };
  now?: () => Date;
};

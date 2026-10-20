import type { WallId } from "@boothwall/shared";

import { createDb } from "@/db/client";
import { settingsService } from "@/modules/settings";

/** Host adapters read the same normalized settings as the event API. */
export const readWallSettings = (database: D1Database, wallId: WallId) =>
  settingsService.get(createDb(database), wallId, "stored");

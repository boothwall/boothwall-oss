import { readConfig } from "@/config/env";
import type { AppBindings } from "@/core/runtime/bindings";
import { createDb } from "@/db/client";
import { adminGuardService } from "@/modules/auth";
import { photoService } from "@/modules/photo";

/** Cron entry: idempotent purge of photos past retention and of old admin-failure rows. */
export async function purgeExpiredPhotos(env: AppBindings): Promise<void> {
  const db = createDb(env.DB);
  const purged = await photoService.purgeExpired(
    { db, bucket: env.PHOTOS },
    { retentionDays: readConfig(env).RETENTION_DAYS },
  );
  await purgeExpiredAdminFailures(env);
  console.info(`purge-expired-photos: removed ${purged} photo(s)`);
}

/** Shared hygiene for hosts that provide their own photo retention policy. */
export async function purgeExpiredAdminFailures(env: Pick<AppBindings, "DB">): Promise<void> {
  await adminGuardService.purge(createDb(env.DB), new Date());
}

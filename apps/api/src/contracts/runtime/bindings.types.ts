import type { WallRoomNamespace } from "./wall-room.types";

/** Worker bindings, mirroring cloudflare.config.ts. */
export type AppBindings = {
  DB: D1Database;
  PHOTOS: R2Bucket;
  WALL: WallRoomNamespace;
  ADMIN_TOKEN: string;
  /** Server-only random key; never the Control passcode. Required for rate-limited mutations. */
  CLIENT_FINGERPRINT_KEY?: string;
  ALLOWED_ORIGINS: string;
  RETENTION_DAYS: string;
};

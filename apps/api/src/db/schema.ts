import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    /** The wall this photo belongs to; a self-hosted BoothWall only has the default one. */
    wallId: text("wall_id").notNull().default("default"),
    caption: text("caption"),
    tribe: text("tribe").notNull(),
    /**
     * "pending" until approved at the booth; only "approved" shows on the wall. "hidden" is
     * taken off the wall from the Control panel but kept.
     */
    status: text("status", { enum: ["pending", "approved", "hidden"] })
      .notNull()
      .default("pending"),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    /** Small JPEG for wall cards; null for photos stored before thumbnails existed. */
    thumbKey: text("thumb_key"),
    /** Daily keyed client fingerprint; legacy rows keep their original digest until normal cleanup. */
    ipHash: text("client_fingerprint").notNull(),
    deleteTokenHash: text("delete_token_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    removedAt: integer("removed_at", { mode: "timestamp_ms" }),
    /** Exempt from retention, e.g. a demo wall's starter photos. Set through PATCH. */
    keep: integer("keep", { mode: "boolean" }).notNull().default(false),
    /** Reaction taps as a JSON object of reaction → count, e.g. {"heart":3}. */
    reactions: text("reactions").notNull().default("{}"),
  },
  (table) => [
    index("photos_created_at_idx").on(table.createdAt),
    index("photos_status_created_at_idx").on(table.status, table.createdAt),
    index("photos_ip_hash_created_at_idx").on(table.ipHash, table.createdAt),
    // The Control panel filters and sorts by category.
    index("photos_tribe_created_at_idx").on(table.tribe, table.createdAt),
    index("photos_wall_status_created_at_idx").on(table.wallId, table.status, table.createdAt),
  ],
);

/** Wrong admin passcodes per daily keyed client, for lockout. Purged nightly. */
export const authFailures = sqliteTable(
  "auth_failures",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ipHash: text("client_fingerprint").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("auth_failures_ip_hash_created_at_idx").on(table.ipHash, table.createdAt)],
);

/** Small key-value store; "wall" holds the default wall's live settings as JSON. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type PhotoRow = typeof photos.$inferSelect;
export type NewPhotoRow = typeof photos.$inferInsert;

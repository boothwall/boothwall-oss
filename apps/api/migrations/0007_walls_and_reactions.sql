ALTER TABLE `photos` ADD `wall_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `photos` ADD `reactions` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE INDEX `photos_wall_status_created_at_idx` ON `photos` (`wall_id`,`status`,`created_at`);
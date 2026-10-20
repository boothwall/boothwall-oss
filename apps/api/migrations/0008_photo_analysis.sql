CREATE TABLE `photo_analysis` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`wall_id` text NOT NULL,
	`verdict` text NOT NULL,
	`flags` text DEFAULT '[]' NOT NULL,
	`issues` text DEFAULT '[]' NOT NULL,
	`suggested_tribe` text,
	`suggested_caption` text,
	`highlight` real,
	`analysed_at` integer NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);

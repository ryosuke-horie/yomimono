CREATE TABLE `article_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-06-12T05:06:01.537Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2025-06-12T05:06:01.536Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-12T05:06:01.536Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-06-12T05:06:01.536Z"' NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_bookmark_id_unique` ON `favorites` (`bookmark_id`);--> statement-breakpoint
CREATE TABLE `labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT '"2025-06-12T05:06:01.536Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-12T05:06:01.536Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `labels_name_unique` ON `labels` (`name`);
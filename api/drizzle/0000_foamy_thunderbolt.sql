CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2025-02-28T17:51:46.423Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-02-28T17:51:46.423Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookmarks_url` ON `bookmarks` (`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookmarks_created_at` ON `bookmarks` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookmarks_is_read` ON `bookmarks` (`is_read`);
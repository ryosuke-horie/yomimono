CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2025-03-01T17:43:28.219Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-03-01T17:43:28.219Z"' NOT NULL
);

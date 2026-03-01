DROP TABLE `article_labels`;--> statement-breakpoint
DROP TABLE `books`;--> statement-breakpoint
DROP TABLE `labels`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2026-03-01T00:25:32.089Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2026-03-01T00:25:32.089Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bookmarks`("id", "url", "title", "is_read", "created_at", "updated_at") SELECT "id", "url", "title", "is_read", "created_at", "updated_at" FROM `bookmarks`;--> statement-breakpoint
DROP TABLE `bookmarks`;--> statement-breakpoint
ALTER TABLE `__new_bookmarks` RENAME TO `bookmarks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_bookmarks_is_read` ON `bookmarks` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_bookmarks_created_at` ON `bookmarks` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_bookmarks_is_read_created_at` ON `bookmarks` (`is_read`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2026-03-01T00:25:32.090Z"' NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_favorites`("id", "bookmark_id", "created_at") SELECT "id", "bookmark_id", "created_at" FROM `favorites`;--> statement-breakpoint
DROP TABLE `favorites`;--> statement-breakpoint
ALTER TABLE `__new_favorites` RENAME TO `favorites`;--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_bookmark_id_unique` ON `favorites` (`bookmark_id`);
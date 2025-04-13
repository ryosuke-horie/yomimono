CREATE TABLE `article_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-04-13T09:09:13.311Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT '"2025-04-13T09:09:13.311Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-04-13T09:09:13.311Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `labels_name_unique` ON `labels` (`name`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2025-04-13T09:09:13.310Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-04-13T09:09:13.310Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bookmarks`("id", "url", "title", "is_read", "created_at", "updated_at") SELECT "id", "url", "title", "is_read", "created_at", "updated_at" FROM `bookmarks`;--> statement-breakpoint
DROP TABLE `bookmarks`;--> statement-breakpoint
ALTER TABLE `__new_bookmarks` RENAME TO `bookmarks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-04-13T09:09:13.310Z"' NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_favorites`("id", "bookmark_id", "created_at") SELECT "id", "bookmark_id", "created_at" FROM `favorites`;--> statement-breakpoint
DROP TABLE `favorites`;--> statement-breakpoint
ALTER TABLE `__new_favorites` RENAME TO `favorites`;--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_bookmark_id_unique` ON `favorites` (`bookmark_id`);
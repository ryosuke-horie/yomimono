CREATE TABLE `rss_batch_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer NOT NULL,
	`status` text NOT NULL,
	`items_fetched` integer DEFAULT 0 NOT NULL,
	`items_created` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rss_feed_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer NOT NULL,
	`guid` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`published_at` integer,
	`fetched_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action,
	UNIQUE(feed_id, guid)
);
--> statement-breakpoint
CREATE INDEX `idx_rss_feed_items_feed_published` ON `rss_feed_items` (`feed_id`, `published_at`);
--> statement-breakpoint
CREATE TABLE `rss_feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`next_fetch_at` integer,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rss_feeds_url_unique` ON `rss_feeds` (`url`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_article_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_article_labels`("id", "article_id", "label_id", "created_at") SELECT "id", "article_id", "label_id", "created_at" FROM `article_labels`;--> statement-breakpoint
DROP TABLE `article_labels`;--> statement-breakpoint
ALTER TABLE `__new_article_labels` RENAME TO `article_labels`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`summary` text,
	`summary_created_at` integer,
	`summary_updated_at` integer,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bookmarks`("id", "url", "title", "is_read", "summary", "summary_created_at", "summary_updated_at", "created_at", "updated_at") SELECT "id", "url", "title", "is_read", "summary", "summary_created_at", "summary_updated_at", "created_at", "updated_at" FROM `bookmarks`;--> statement-breakpoint
DROP TABLE `bookmarks`;--> statement-breakpoint
ALTER TABLE `__new_bookmarks` RENAME TO `bookmarks`;--> statement-breakpoint
CREATE TABLE `__new_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_favorites`("id", "bookmark_id", "created_at") SELECT "id", "bookmark_id", "created_at" FROM `favorites`;--> statement-breakpoint
DROP TABLE `favorites`;--> statement-breakpoint
ALTER TABLE `__new_favorites` RENAME TO `favorites`;--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_bookmark_id_unique` ON `favorites` (`bookmark_id`);--> statement-breakpoint
CREATE TABLE `__new_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-05-17T16:21:48.391Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_labels`("id", "name", "description", "created_at", "updated_at") SELECT "id", "name", "description", "created_at", "updated_at" FROM `labels`;--> statement-breakpoint
DROP TABLE `labels`;--> statement-breakpoint
ALTER TABLE `__new_labels` RENAME TO `labels`;--> statement-breakpoint
CREATE UNIQUE INDEX `labels_name_unique` ON `labels` (`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rss_feed_items_feed_guid` ON `rss_feed_items` (`feed_id`, `guid`);
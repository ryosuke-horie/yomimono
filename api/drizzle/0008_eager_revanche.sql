CREATE TABLE `article_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`practical_value` integer NOT NULL,
	`technical_depth` integer NOT NULL,
	`understanding` integer NOT NULL,
	`novelty` integer NOT NULL,
	`importance` integer NOT NULL,
	`total_score` integer NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_ratings_article_id_unique` ON `article_ratings` (`article_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_article_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
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
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bookmarks`("id", "url", "title", "is_read", "created_at", "updated_at") SELECT "id", "url", "title", "is_read", "created_at", "updated_at" FROM `bookmarks`;--> statement-breakpoint
DROP TABLE `bookmarks`;--> statement-breakpoint
ALTER TABLE `__new_bookmarks` RENAME TO `bookmarks`;--> statement-breakpoint
CREATE TABLE `__new_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL,
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
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_labels`("id", "name", "description", "created_at", "updated_at") SELECT "id", "name", "description", "created_at", "updated_at" FROM `labels`;--> statement-breakpoint
DROP TABLE `labels`;--> statement-breakpoint
ALTER TABLE `__new_labels` RENAME TO `labels`;--> statement-breakpoint
CREATE UNIQUE INDEX `labels_name_unique` ON `labels` (`name`);--> statement-breakpoint
CREATE TABLE `__new_rss_batch_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer,
	`status` text NOT NULL,
	`items_fetched` integer DEFAULT 0 NOT NULL,
	`items_created` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_rss_batch_logs`("id", "feed_id", "status", "items_fetched", "items_created", "error_message", "started_at", "finished_at", "created_at") SELECT "id", "feed_id", "status", "items_fetched", "items_created", "error_message", "started_at", "finished_at", "created_at" FROM `rss_batch_logs`;--> statement-breakpoint
DROP TABLE `rss_batch_logs`;--> statement-breakpoint
ALTER TABLE `__new_rss_batch_logs` RENAME TO `rss_batch_logs`;--> statement-breakpoint
CREATE TABLE `__new_rss_feed_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer NOT NULL,
	`guid` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`published_at` integer,
	`fetched_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_rss_feed_items`("id", "feed_id", "guid", "url", "title", "description", "published_at", "fetched_at", "created_at") SELECT "id", "feed_id", "guid", "url", "title", "description", "published_at", "fetched_at", "created_at" FROM `rss_feed_items`;--> statement-breakpoint
DROP TABLE `rss_feed_items`;--> statement-breakpoint
ALTER TABLE `__new_rss_feed_items` RENAME TO `rss_feed_items`;--> statement-breakpoint
CREATE TABLE `__new_rss_feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`next_fetch_at` integer,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_rss_feeds`("id", "name", "url", "is_active", "last_fetched_at", "next_fetch_at", "created_at", "updated_at") SELECT "id", "name", "url", "is_active", "last_fetched_at", "next_fetch_at", "created_at", "updated_at" FROM `rss_feeds`;--> statement-breakpoint
DROP TABLE `rss_feeds`;--> statement-breakpoint
ALTER TABLE `__new_rss_feeds` RENAME TO `rss_feeds`;--> statement-breakpoint
CREATE UNIQUE INDEX `rss_feeds_url_unique` ON `rss_feeds` (`url`);
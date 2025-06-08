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
	`created_at` integer DEFAULT '"2025-06-08T12:16:26.002Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-08T12:16:26.002Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_ratings_article_id_unique` ON `article_ratings` (`article_id`);
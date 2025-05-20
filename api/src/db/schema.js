import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
// ブックマーク
export const bookmarks = sqliteTable("bookmarks", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	url: text("url").notNull(),
	title: text("title"),
	isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
	summary: text("summary"), // 記事の要約（マークダウン形式）
	summaryCreatedAt: integer("summary_created_at", { mode: "timestamp" }), // 要約が最初に生成された日時
	summaryUpdatedAt: integer("summary_updated_at", { mode: "timestamp" }), // 要約が最後に更新された日時
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});
// お気に入り記事
export const favorites = sqliteTable("favorites", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	bookmarkId: integer("bookmark_id")
		.notNull()
		.unique()
		.references(() => bookmarks.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});
// ラベルマスター
export const labels = sqliteTable("labels", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(), // ラベル名（正規化済み）
	description: text("description"), // ラベルの説明文
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});
// 記事-ラベル紐付け
export const articleLabels = sqliteTable("article_labels", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	articleId: integer("article_id")
		.notNull()
		.references(() => bookmarks.id, { onDelete: "cascade" }), // bookmarksテーブルを参照
	labelId: integer("label_id")
		.notNull()
		.references(() => labels.id, { onDelete: "cascade" }), // labelsテーブルを参照
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});
// RSSフィード
export const rssFeeds = sqliteTable("rss_feeds", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	url: text("url").notNull().unique(),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
	nextFetchAt: integer("next_fetch_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});
// RSSフィードアイテム
export const rssFeedItems = sqliteTable("rss_feed_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	feedId: integer("feed_id")
		.notNull()
		.references(() => rssFeeds.id),
	guid: text("guid").notNull(),
	url: text("url").notNull(),
	title: text("title").notNull(),
	description: text("description"),
	publishedAt: integer("published_at", { mode: "timestamp" }),
	fetchedAt: integer("fetched_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});
// RSSバッチログ
export const rssBatchLogs = sqliteTable("rss_batch_logs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	feedId: integer("feed_id")
		.notNull()
		.references(() => rssFeeds.id),
	status: text("status").notNull(),
	itemsFetched: integer("items_fetched").notNull().default(0),
	itemsCreated: integer("items_created").notNull().default(0),
	errorMessage: text("error_message"),
	startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
	finishedAt: integer("finished_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(new Date()),
});

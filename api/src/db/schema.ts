import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ブックマーク
export const bookmarks = sqliteTable("bookmarks", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	url: text("url").notNull(),
	title: text("title"),
	isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
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

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type InsertLabel = typeof labels.$inferInsert;
export type ArticleLabel = typeof articleLabels.$inferSelect;
export type InsertArticleLabel = typeof articleLabels.$inferInsert;

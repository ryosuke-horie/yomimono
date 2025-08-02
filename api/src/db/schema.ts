import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ブックマーク
export const bookmarks = sqliteTable(
	"bookmarks",
	{
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
	},
	(table) => {
		return {
			// 未読/既読フィルタリング用インデックス
			isReadIdx: index("idx_bookmarks_is_read").on(table.isRead),
			// 作成日時での並び替え用インデックス
			createdAtIdx: index("idx_bookmarks_created_at").on(table.createdAt),
			// 未読記事の作成日時順取得用複合インデックス（最も一般的なクエリパターン）
			isReadCreatedAtIdx: index("idx_bookmarks_is_read_created_at").on(
				table.isRead,
				table.createdAt,
			),
		};
	},
);

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
export const articleLabels = sqliteTable(
	"article_labels",
	{
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
	},
	(table) => {
		return {
			// article_id でのJOIN最適化用インデックス（最重要）
			articleIdIdx: index("idx_article_labels_article_id").on(table.articleId),
			// label_id でのJOIN最適化用インデックス
			labelIdIdx: index("idx_article_labels_label_id").on(table.labelId),
			// 記事-ラベルペアの一意性とJOIN最適化用複合インデックス
			articleLabelIdx: index("idx_article_labels_article_label").on(
				table.articleId,
				table.labelId,
			),
		};
	},
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type InsertLabel = typeof labels.$inferInsert;
export type ArticleLabel = typeof articleLabels.$inferSelect;
export type InsertArticleLabel = typeof articleLabels.$inferInsert;
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

// 本棚機能
export const books = sqliteTable(
	"books",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		type: text("type").notNull(), // 'book', 'pdf', 'github', 'zenn'
		title: text("title").notNull(),
		url: text("url"), // PDF/GitHub/Zennの場合のURL
		imageUrl: text("image_url"), // 書籍の表紙画像URL
		status: text("status").notNull().default("unread"), // 'unread', 'reading', 'completed'
		completedAt: integer("completed_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(new Date()),
	},
	(table) => {
		return {
			// ステータスでのフィルタリング用インデックス
			statusIdx: index("idx_books_status").on(table.status),
			// タイプでのフィルタリング用インデックス
			typeIdx: index("idx_books_type").on(table.type),
			// 作成日時での並び替え用インデックス
			createdAtIdx: index("idx_books_created_at").on(table.createdAt),
			// ステータスと作成日時の複合インデックス（よくあるクエリパターン）
			statusCreatedAtIdx: index("idx_books_status_created_at").on(
				table.status,
				table.createdAt,
			),
		};
	},
);

// BookmarkWithLabel type for external use
export type BookmarkWithLabel = Bookmark & {
	isFavorite: boolean;
	label: Label | null;
};

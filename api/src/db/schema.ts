import { sql } from "drizzle-orm";
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
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
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
		.default(sql`(unixepoch())`),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// BookmarkWithFavorite type for external use
export type BookmarkWithFavorite = Bookmark & {
	isFavorite: boolean;
};

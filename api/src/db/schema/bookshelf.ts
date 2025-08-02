/**
 * 本棚機能のスキーマ定義
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

// 型定義
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

// コンテンツタイプの定義
export const BookType = {
	BOOK: "book",
	PDF: "pdf",
	GITHUB: "github",
	ZENN: "zenn",
} as const;

export type BookTypeValue = (typeof BookType)[keyof typeof BookType];

// ステータスの定義
export const BookStatus = {
	UNREAD: "unread",
	READING: "reading",
	COMPLETED: "completed",
} as const;

export type BookStatusValue = (typeof BookStatus)[keyof typeof BookStatus];

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("BookType定数が正しく定義されている", () => {
		expect(BookType.BOOK).toBe("book");
		expect(BookType.PDF).toBe("pdf");
		expect(BookType.GITHUB).toBe("github");
		expect(BookType.ZENN).toBe("zenn");
	});

	test("BookStatus定数が正しく定義されている", () => {
		expect(BookStatus.UNREAD).toBe("unread");
		expect(BookStatus.READING).toBe("reading");
		expect(BookStatus.COMPLETED).toBe("completed");
	});
}

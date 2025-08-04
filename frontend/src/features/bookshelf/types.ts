/**
 * 本棚機能の型定義
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理
 */

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

// 本棚アイテムの型定義
export interface Book {
	id: number;
	type: BookTypeValue;
	title: string;
	url: string | null;
	imageUrl: string | null;
	status: BookStatusValue;
	progress?: number; // 読書進捗率（0-100）
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

// 本棚アイテム作成時の型定義
export interface CreateBookInput {
	type: BookTypeValue;
	title: string;
	url?: string | null;
	imageUrl?: string | null;
}

// 本棚アイテム更新時の型定義
export interface UpdateBookInput {
	type?: BookTypeValue;
	title?: string;
	url?: string | null;
	imageUrl?: string | null;
	status?: BookStatusValue;
	progress?: number;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("BookType定数", () => {
		it("正しい値が定義されている", () => {
			expect(BookType.BOOK).toBe("book");
			expect(BookType.PDF).toBe("pdf");
			expect(BookType.GITHUB).toBe("github");
			expect(BookType.ZENN).toBe("zenn");
		});
	});

	describe("BookStatus定数", () => {
		it("正しい値が定義されている", () => {
			expect(BookStatus.UNREAD).toBe("unread");
			expect(BookStatus.READING).toBe("reading");
			expect(BookStatus.COMPLETED).toBe("completed");
		});
	});

	describe("Book型", () => {
		it("Book型のプロパティが正しく定義されている", () => {
			const book: Book = {
				id: 1,
				type: "book",
				title: "テスト書籍",
				url: null,
				imageUrl: "https://example.com/image.jpg",
				status: "unread",
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(book.id).toBe(1);
			expect(book.type).toBe("book");
			expect(book.title).toBe("テスト書籍");
		});

		it("PDF型のBookが作成できる", () => {
			const pdfBook: Book = {
				id: 2,
				type: "pdf",
				title: "テストPDF",
				url: "https://example.com/test.pdf",
				imageUrl: null,
				status: "reading",
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(pdfBook.type).toBe("pdf");
			expect(pdfBook.url).toBe("https://example.com/test.pdf");
		});
	});

	describe("CreateBookInput型", () => {
		it("必須フィールドのみで作成できる", () => {
			const input: CreateBookInput = {
				type: "book",
				title: "新しい書籍",
			};
			expect(input.type).toBe("book");
			expect(input.title).toBe("新しい書籍");
			expect(input.url).toBeUndefined();
		});

		it("オプショナルフィールドも設定できる", () => {
			const input: CreateBookInput = {
				type: "github",
				title: "GitHubリポジトリ",
				url: "https://github.com/user/repo",
				imageUrl: "https://example.com/preview.png",
			};
			expect(input.url).toBe("https://github.com/user/repo");
			expect(input.imageUrl).toBe("https://example.com/preview.png");
		});
	});

	describe("UpdateBookInput型", () => {
		it("部分的な更新が可能", () => {
			const input: UpdateBookInput = {
				status: "completed",
			};
			expect(input.status).toBe("completed");
			expect(input.title).toBeUndefined();
		});

		it("複数フィールドの更新が可能", () => {
			const input: UpdateBookInput = {
				title: "更新後のタイトル",
				status: "reading",
				url: "https://new-url.com",
			};
			expect(input.title).toBe("更新後のタイトル");
			expect(input.status).toBe("reading");
			expect(input.url).toBe("https://new-url.com");
		});
	});
}

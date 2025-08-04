/**
 * 本棚機能のAPI関数
 * 書籍、PDF、GitHub、Zennなどのコンテンツの取得・作成・更新・削除
 */

import type {
	Book,
	BookStatusValue,
	CreateBookInput,
	UpdateBookInput,
} from "@/features/bookshelf/types";
import { API_BASE_URL } from "@/lib/api/config";

// APIレスポンスの型定義
interface BookshelfApiResponse<T = Book> {
	success: boolean;
	book?: T;
	books?: T[];
	error?: string;
	message?: string;
}

// --- Query Functions ---

/**
 * 本棚アイテム一覧を取得
 * @param status ステータスでフィルタリング（オプション）
 * @returns 本棚アイテムの配列
 */
export const getBooks = async (status?: BookStatusValue): Promise<Book[]> => {
	const params = new URLSearchParams();
	if (status) {
		params.append("status", status);
	}

	const url = `${API_BASE_URL}/api/bookshelf${params.toString() ? `?${params.toString()}` : ""}`;
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch books: ${response.status}`);
	}

	const data = (await response.json()) as BookshelfApiResponse<Book>;
	if (!data.success) {
		throw new Error(data.error || "Failed to fetch books");
	}

	return data.books || [];
};

/**
 * 特定の本棚アイテムを取得
 * @param id アイテムID
 * @returns 本棚アイテム
 */
export const getBook = async (id: number): Promise<Book> => {
	const url = `${API_BASE_URL}/api/bookshelf/${id}`;
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch book: ${response.status}`);
	}

	const data = (await response.json()) as BookshelfApiResponse<Book>;
	if (!data.success || !data.book) {
		throw new Error(data.error || "Failed to fetch book");
	}

	return data.book;
};

// --- Mutation Functions ---

/**
 * 新しい本棚アイテムを作成
 * @param input 作成するアイテムのデータ
 * @returns 作成されたアイテム
 */
export const createBook = async (input: CreateBookInput): Promise<Book> => {
	const url = `${API_BASE_URL}/api/bookshelf`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(`Failed to create book: ${response.status}`);
	}

	const data = (await response.json()) as BookshelfApiResponse<Book>;
	if (!data.success || !data.book) {
		throw new Error(data.error || "Failed to create book");
	}

	return data.book;
};

/**
 * 本棚アイテムを更新
 * @param id アイテムID
 * @param input 更新するデータ
 * @returns 更新されたアイテム
 */
export const updateBook = async (
	id: number,
	input: UpdateBookInput,
): Promise<Book> => {
	const url = `${API_BASE_URL}/api/bookshelf/${id}`;
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(`Failed to update book: ${response.status}`);
	}

	const data = (await response.json()) as BookshelfApiResponse<Book>;
	if (!data.success || !data.book) {
		throw new Error(data.error || "Failed to update book");
	}

	return data.book;
};

/**
 * 本棚アイテムのステータスを更新
 * @param id アイテムID
 * @param status 新しいステータス
 * @returns 更新されたアイテム
 */
export const updateBookStatus = async (
	id: number,
	status: BookStatusValue,
): Promise<Book> => {
	const url = `${API_BASE_URL}/api/bookshelf/${id}/status`;
	const response = await fetch(url, {
		method: "PATCH",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ status }),
	});

	if (!response.ok) {
		throw new Error(`Failed to update book status: ${response.status}`);
	}

	const data = (await response.json()) as BookshelfApiResponse<Book>;
	if (!data.success || !data.book) {
		throw new Error(data.error || "Failed to update book status");
	}

	return data.book;
};

/**
 * 本棚アイテムを削除
 * @param id アイテムID
 */
export const deleteBook = async (id: number): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookshelf/${id}`;
	const response = await fetch(url, {
		method: "DELETE",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to delete book: ${response.status}`);
	}

	const data = (await response.json()) as BookshelfApiResponse;
	if (!data.success) {
		throw new Error(data.error || "Failed to delete book");
	}
};

if (import.meta.vitest) {
	const { describe, it, expect, vi, beforeEach } = import.meta.vitest;

	describe("getBooks", () => {
		beforeEach(() => {
			global.fetch = vi.fn();
		});

		it("ステータスフィルターなしで本棚アイテムを取得できる", async () => {
			const mockBooks: Book[] = [
				{
					id: 1,
					type: "book",
					title: "テスト書籍",
					url: null,
					imageUrl: null,
					status: "unread",
					completedAt: null,
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-01T00:00:00Z",
				},
			];

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, books: mockBooks }),
			});

			const result = await getBooks();
			expect(result).toEqual(mockBooks);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookshelf"),
				expect.objectContaining({
					headers: expect.objectContaining({
						Accept: "application/json",
					}),
				}),
			);
		});

		it("ステータスフィルター付きで本棚アイテムを取得できる", async () => {
			const mockBooks: Book[] = [];

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, books: mockBooks }),
			});

			const result = await getBooks("reading");
			expect(result).toEqual(mockBooks);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookshelf?status=reading"),
				expect.any(Object),
			);
		});

		it("APIエラー時に例外をスローする", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			await expect(getBooks()).rejects.toThrow("Failed to fetch books: 500");
		});
	});

	describe("createBook", () => {
		beforeEach(() => {
			global.fetch = vi.fn();
		});

		it("新しい本棚アイテムを作成できる", async () => {
			const input: CreateBookInput = {
				type: "book",
				title: "新しい書籍",
				url: null,
				imageUrl: "https://example.com/image.jpg",
			};

			const mockBook: Book = {
				id: 1,
				...input,
				status: "unread",
				completedAt: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			} as Book;

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, book: mockBook }),
			});

			const result = await createBook(input);
			expect(result).toEqual(mockBook);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookshelf"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(input),
				}),
			);
		});
	});

	describe("updateBookStatus", () => {
		beforeEach(() => {
			global.fetch = vi.fn();
		});

		it("本棚アイテムのステータスを更新できる", async () => {
			const mockBook: Book = {
				id: 1,
				type: "book",
				title: "テスト書籍",
				url: null,
				imageUrl: null,
				status: "completed",
				completedAt: "2024-01-02T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			};

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, book: mockBook }),
			});

			const result = await updateBookStatus(1, "completed");
			expect(result.status).toBe("completed");
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookshelf/1/status"),
				expect.objectContaining({
					method: "PATCH",
					body: JSON.stringify({ status: "completed" }),
				}),
			);
		});
	});

	describe("deleteBook", () => {
		beforeEach(() => {
			global.fetch = vi.fn();
		});

		it("本棚アイテムを削除できる", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: "Book deleted successfully",
				}),
			});

			await deleteBook(1);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/bookshelf/1"),
				expect.objectContaining({
					method: "DELETE",
				}),
			);
		});
	});
}

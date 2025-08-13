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

// APIエラークラス
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly details: {
			cause?: unknown;
			statusCode?: number;
			operation?: string;
			endpoint?: string;
		} = {},
	) {
		super(message);
		this.name = "ApiError";
	}
}

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
	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				`本棚アイテムの取得に失敗しました: ${errorData.error || response.statusText}`,
				{
					statusCode: response.status,
					operation: "get_books",
					endpoint: url,
					cause: errorData,
				},
			);
		}

		const data = (await response.json()) as BookshelfApiResponse<Book>;
		if (!data.success) {
			throw new ApiError(data.error || "本棚アイテムの取得に失敗しました", {
				operation: "get_books",
				endpoint: url,
			});
		}

		return data.books || [];
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError("本棚アイテムの取得中にエラーが発生しました", {
			cause: error,
			operation: "get_books",
			endpoint: url,
		});
	}
};

/**
 * 特定の本棚アイテムを取得
 * @param id アイテムID
 * @returns 本棚アイテム
 */
export const getBook = async (id: number): Promise<Book> => {
	const url = `${API_BASE_URL}/api/bookshelf/${id}`;
	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				`本棚アイテムの取得に失敗しました (ID: ${id}): ${errorData.error || response.statusText}`,
				{
					statusCode: response.status,
					operation: "get_book",
					endpoint: url,
					cause: errorData,
				},
			);
		}

		const data = (await response.json()) as BookshelfApiResponse<Book>;
		if (!data.success || !data.book) {
			throw new ApiError(
				data.error || `本棚アイテムが見つかりません (ID: ${id})`,
				{
					operation: "get_book",
					endpoint: url,
				},
			);
		}

		return data.book;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(
			`本棚アイテムの取得中にエラーが発生しました (ID: ${id})`,
			{
				cause: error,
				operation: "get_book",
				endpoint: url,
			},
		);
	}
};

// --- Mutation Functions ---

/**
 * 新しい本棚アイテムを作成
 * @param input 作成するアイテムのデータ
 * @returns 作成されたアイテム
 */
export const createBook = async (input: CreateBookInput): Promise<Book> => {
	const url = `${API_BASE_URL}/api/bookshelf`;
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				`本棚アイテムの作成に失敗しました: ${errorData.error || response.statusText}`,
				{
					statusCode: response.status,
					operation: "create_book",
					endpoint: url,
					cause: errorData,
				},
			);
		}

		const data = (await response.json()) as BookshelfApiResponse<Book>;
		if (!data.success || !data.book) {
			throw new ApiError(data.error || "本棚アイテムの作成に失敗しました", {
				operation: "create_book",
				endpoint: url,
			});
		}

		return data.book;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError("本棚アイテムの作成中にエラーが発生しました", {
			cause: error,
			operation: "create_book",
			endpoint: url,
		});
	}
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
	try {
		const response = await fetch(url, {
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				`本棚アイテムの更新に失敗しました (ID: ${id}): ${errorData.error || response.statusText}`,
				{
					statusCode: response.status,
					operation: "update_book",
					endpoint: url,
					cause: errorData,
				},
			);
		}

		const data = (await response.json()) as BookshelfApiResponse<Book>;
		if (!data.success || !data.book) {
			throw new ApiError(
				data.error || `本棚アイテムの更新に失敗しました (ID: ${id})`,
				{
					operation: "update_book",
					endpoint: url,
				},
			);
		}

		return data.book;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(
			`本棚アイテムの更新中にエラーが発生しました (ID: ${id})`,
			{
				cause: error,
				operation: "update_book",
				endpoint: url,
			},
		);
	}
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
	try {
		const response = await fetch(url, {
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ status }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				`ステータスの更新に失敗しました (ID: ${id}): ${errorData.error || response.statusText}`,
				{
					statusCode: response.status,
					operation: "update_book_status",
					endpoint: url,
					cause: errorData,
				},
			);
		}

		const data = (await response.json()) as BookshelfApiResponse<Book>;
		if (!data.success || !data.book) {
			throw new ApiError(
				data.error || `ステータスの更新に失敗しました (ID: ${id})`,
				{
					operation: "update_book_status",
					endpoint: url,
				},
			);
		}

		return data.book;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(`ステータスの更新中にエラーが発生しました (ID: ${id})`, {
			cause: error,
			operation: "update_book_status",
			endpoint: url,
		});
	}
};

/**
 * 本棚アイテムを削除
 * @param id アイテムID
 */
export const deleteBook = async (id: number): Promise<void> => {
	const url = `${API_BASE_URL}/api/bookshelf/${id}`;
	try {
		const response = await fetch(url, {
			method: "DELETE",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiError(
				`本棚アイテムの削除に失敗しました (ID: ${id}): ${errorData.error || response.statusText}`,
				{
					statusCode: response.status,
					operation: "delete_book",
					endpoint: url,
					cause: errorData,
				},
			);
		}

		const data = (await response.json()) as BookshelfApiResponse;
		if (!data.success) {
			throw new ApiError(
				data.error || `本棚アイテムの削除に失敗しました (ID: ${id})`,
				{
					operation: "delete_book",
					endpoint: url,
				},
			);
		}
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(
			`本棚アイテムの削除中にエラーが発生しました (ID: ${id})`,
			{
				cause: error,
				operation: "delete_book",
				endpoint: url,
			},
		);
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

		it("APIエラー時にApiErrorをスローする", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: async () => ({ error: "サーバーエラー" }),
			});

			try {
				await getBooks();
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect(error).toMatchObject({
					name: "ApiError",
					message: expect.stringContaining("本棚アイテムの取得に失敗しました"),
					details: expect.objectContaining({
						statusCode: 500,
						operation: "get_books",
					}),
				});
			}
		});
		it("レスポンスパースエラー時にApiErrorをスローする", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: false, error: "データ不正" }),
			});

			try {
				await getBooks();
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect(error).toMatchObject({
					name: "ApiError",
					message: "データ不正",
					details: expect.objectContaining({
						operation: "get_books",
					}),
				});
			}
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

		it("作成失敗時にApiErrorをスローする", async () => {
			const input: CreateBookInput = {
				type: "book",
				title: "新しい書籍",
				url: null,
				imageUrl: null,
			};

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: "Bad Request",
				json: async () => ({ error: "必須項目が不足しています" }),
			});

			try {
				await createBook(input);
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect(error).toMatchObject({
					name: "ApiError",
					message: expect.stringContaining("本棚アイテムの作成に失敗しました"),
					details: expect.objectContaining({
						statusCode: 400,
						operation: "create_book",
					}),
				});
			}
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

		it("ステータス更新失敗時にApiErrorをスローする", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: async () => ({ error: "アイテムが見つかりません" }),
			});

			try {
				await updateBookStatus(999, "completed");
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect(error).toMatchObject({
					name: "ApiError",
					message: expect.stringContaining("ステータスの更新に失敗しました"),
					details: expect.objectContaining({
						statusCode: 404,
						operation: "update_book_status",
					}),
				});
			}
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

		it("削除失敗時にApiErrorをスローする", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 403,
				statusText: "Forbidden",
				json: async () => ({ error: "削除権限がありません" }),
			});

			try {
				await deleteBook(1);
				expect.fail("エラーがスローされるべき");
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect(error).toMatchObject({
					name: "ApiError",
					message: expect.stringContaining("本棚アイテムの削除に失敗しました"),
					details: expect.objectContaining({
						statusCode: 403,
						operation: "delete_book",
					}),
				});
			}
		});
	});
}

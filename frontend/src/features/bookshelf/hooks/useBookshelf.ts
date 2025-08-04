/**
 * 本棚機能のカスタムフック
 * APIとの通信とステート管理を行う
 */

"use client";

import { useCallback, useState } from "react";
import type { Book, CreateBookInput } from "../types";
import { useMockBookshelf } from "./useMockBookshelf";

// 環境変数でモックデータの使用を制御
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function useBookshelf() {
	const mockHook = useMockBookshelf();
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchBooks = useCallback(async () => {
		// モックデータを使用する場合
		if (USE_MOCK_DATA) {
			return mockHook.fetchBooks();
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/api/bookshelf`);

			if (!response.ok) {
				const errorMessage = `本の取得に失敗しました (${response.status})`;
				throw new Error(errorMessage);
			}

			const data = (await response.json()) as { books?: Book[] };
			setBooks(data.books || []);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "本の取得中にエラーが発生しました";
			setError(errorMessage);
			// エラー時は空配列を設定（モックデータは使用しない）
			setBooks([]);
		} finally {
			setLoading(false);
		}
	}, [mockHook]);

	const addBook = useCallback(
		async (bookData: CreateBookInput) => {
			// モックデータを使用する場合
			if (USE_MOCK_DATA) {
				return mockHook.addBook(bookData);
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch(`${API_BASE_URL}/api/bookshelf`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(bookData),
				});

				if (!response.ok) {
					const errorMessage = `本の追加に失敗しました (${response.status})`;
					throw new Error(errorMessage);
				}

				const newBook = (await response.json()) as Book;
				setBooks((prev) => [...prev, newBook]);

				return newBook;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "本の追加中にエラーが発生しました";
				setError(errorMessage);
				// エラー時はnullを返す（モックデータは使用しない）
				return null;
			} finally {
				setLoading(false);
			}
		},
		[mockHook],
	);

	const updateBookStatus = useCallback(
		async (bookId: number, status: Book["status"], progress?: number) => {
			// モックデータを使用する場合
			if (USE_MOCK_DATA) {
				return mockHook.updateBookStatus(bookId, status, progress);
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch(
					`${API_BASE_URL}/api/bookshelf/${bookId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ status, progress }),
					},
				);

				if (!response.ok) {
					const errorMessage = `ステータスの更新に失敗しました (${response.status})`;
					throw new Error(errorMessage);
				}

				const updatedBook = (await response.json()) as Book;
				setBooks((prev) =>
					prev.map((book) => (book.id === bookId ? updatedBook : book)),
				);

				return updatedBook;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "ステータスの更新中にエラーが発生しました";
				setError(errorMessage);
				// エラー時はnullを返す（モックデータは使用しない）
				return null;
			} finally {
				setLoading(false);
			}
		},
		[mockHook],
	);

	const deleteBook = useCallback(
		async (bookId: number) => {
			// モックデータを使用する場合
			if (USE_MOCK_DATA) {
				return mockHook.deleteBook(bookId);
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch(
					`${API_BASE_URL}/api/bookshelf/${bookId}`,
					{
						method: "DELETE",
					},
				);

				if (!response.ok) {
					const errorMessage = `本の削除に失敗しました (${response.status})`;
					throw new Error(errorMessage);
				}

				setBooks((prev) => prev.filter((book) => book.id !== bookId));
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "本の削除中にエラーが発生しました";
				setError(errorMessage);
				// エラー時は削除を実行しない
			} finally {
				setLoading(false);
			}
		},
		[mockHook],
	);

	// モックデータを使用する場合はモックフックの値を返す
	if (USE_MOCK_DATA) {
		return mockHook;
	}

	return {
		books,
		loading,
		error,
		fetchBooks,
		addBook,
		updateBookStatus,
		deleteBook,
	};
}

if (import.meta.vitest) {
	const { test, expect, vi, beforeEach, afterEach } = import.meta.vitest;
	const { renderHook, act, waitFor } = await import("@testing-library/react");

	// fetchのモック
	const originalFetch = global.fetch;

	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.clearAllMocks();
	});

	test("APIから本のリストを取得できる", async () => {
		const mockBooks: Book[] = [
			{
				id: 1,
				title: "Test Book",
				status: "unread",
				type: "book",
				url: null,
				imageUrl: null,
				progress: 0,
				completedAt: null,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			},
		];

		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ books: mockBooks }),
		});

		const { result } = renderHook(() => useBookshelf());

		await act(async () => {
			await result.current.fetchBooks();
		});

		await waitFor(() => {
			expect(result.current.books).toEqual(mockBooks);
			expect(result.current.loading).toBe(false);
			expect(result.current.error).toBeNull();
		});
	});

	test("APIエラー時にエラーメッセージを設定する", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
			status: 500,
		});

		const { result } = renderHook(() => useBookshelf());

		await act(async () => {
			await result.current.fetchBooks();
		});

		await waitFor(() => {
			expect(result.current.error).toBe("本の取得に失敗しました (500)");
			expect(result.current.books).toEqual([]);
			expect(result.current.loading).toBe(false);
		});
	});

	test("新しい本を追加できる", async () => {
		const newBook: Book = {
			id: 1,
			title: "New Book",
			status: "unread",
			type: "book",
			url: null,
			imageUrl: null,
			progress: 0,
			completedAt: null,
			createdAt: "2024-01-01",
			updatedAt: "2024-01-01",
		};

		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			status: 201,
			json: async () => newBook,
		});

		const { result } = renderHook(() => useBookshelf());

		const bookData: CreateBookInput = {
			title: "New Book",
			type: "book",
		};

		await act(async () => {
			const added = await result.current.addBook(bookData);
			expect(added).toEqual(newBook);
		});

		await waitFor(() => {
			expect(result.current.books).toContainEqual(newBook);
			expect(result.current.error).toBeNull();
		});
	});

	test("本の追加失敗時にエラーを返す", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
			status: 400,
		});

		const { result } = renderHook(() => useBookshelf());

		const bookData: CreateBookInput = {
			title: "New Book",
			type: "book",
		};

		await act(async () => {
			const added = await result.current.addBook(bookData);
			expect(added).toBeNull();
		});

		await waitFor(() => {
			expect(result.current.error).toBe("本の追加に失敗しました (400)");
		});
	});
}

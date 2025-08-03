/**
 * 本棚機能のカスタムフック
 * APIとの通信とステート管理を行う
 */

"use client";

import { useCallback, useState } from "react";
import type { Book, CreateBookRequest } from "../types";

export function useBookshelf() {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchBooks = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// TODO: 実際のAPIエンドポイントに置き換える
			const response = await fetch("/api/bookshelf");

			if (!response.ok) {
				throw new Error("本の取得に失敗しました");
			}

			const data = await response.json();
			setBooks(data.books || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "エラーが発生しました");
			// 開発用のモックデータ
			setBooks([
				{
					id: "1",
					title: "Clean Code",
					author: "Robert C. Martin",
					status: "reading",
					type: "book",
					progress: 65,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-15",
				},
				{
					id: "2",
					title: "TypeScript Deep Dive",
					status: "unread",
					type: "pdf",
					createdAt: "2024-01-05",
					updatedAt: "2024-01-05",
				},
				{
					id: "3",
					title: "React Patterns",
					status: "completed",
					type: "repository",
					createdAt: "2024-01-10",
					updatedAt: "2024-01-20",
				},
			]);
		} finally {
			setLoading(false);
		}
	}, []);

	const addBook = useCallback(async (bookData: CreateBookRequest) => {
		setLoading(true);
		setError(null);

		try {
			// TODO: 実際のAPIエンドポイントに置き換える
			const response = await fetch("/api/bookshelf", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(bookData),
			});

			if (!response.ok) {
				throw new Error("本の追加に失敗しました");
			}

			const newBook = await response.json();
			setBooks((prev) => [...prev, newBook]);

			return newBook;
		} catch (err) {
			setError(err instanceof Error ? err.message : "エラーが発生しました");
			// 開発用のモック処理
			const newBook: Book = {
				id: Date.now().toString(),
				...bookData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			setBooks((prev) => [...prev, newBook]);
			return newBook;
		} finally {
			setLoading(false);
		}
	}, []);

	const updateBookStatus = useCallback(
		async (bookId: string, status: Book["status"], progress?: number) => {
			setLoading(true);
			setError(null);

			try {
				// TODO: 実際のAPIエンドポイントに置き換える
				const response = await fetch(`/api/bookshelf/${bookId}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status, progress }),
				});

				if (!response.ok) {
					throw new Error("ステータスの更新に失敗しました");
				}

				const updatedBook = await response.json();
				setBooks((prev) =>
					prev.map((book) => (book.id === bookId ? updatedBook : book)),
				);

				return updatedBook;
			} catch (err) {
				setError(err instanceof Error ? err.message : "エラーが発生しました");
				// 開発用のモック処理
				setBooks((prev) =>
					prev.map((book) =>
						book.id === bookId
							? {
									...book,
									status,
									progress,
									updatedAt: new Date().toISOString(),
								}
							: book,
					),
				);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const deleteBook = useCallback(async (bookId: string) => {
		setLoading(true);
		setError(null);

		try {
			// TODO: 実際のAPIエンドポイントに置き換える
			const response = await fetch(`/api/bookshelf/${bookId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("本の削除に失敗しました");
			}

			setBooks((prev) => prev.filter((book) => book.id !== bookId));
		} catch (err) {
			setError(err instanceof Error ? err.message : "エラーが発生しました");
			// 開発用のモック処理
			setBooks((prev) => prev.filter((book) => book.id !== bookId));
		} finally {
			setLoading(false);
		}
	}, []);

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
	const { test, expect, renderHook, act, waitFor } = await import(
		"@/test-utils"
	);

	test("初期状態が正しく設定される", () => {
		const { result } = renderHook(() => useBookshelf());

		expect(result.current.books).toEqual([]);
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBe(null);
	});

	test("fetchBooksが本のリストを取得する", async () => {
		const { result } = renderHook(() => useBookshelf());

		await act(async () => {
			await result.current.fetchBooks();
		});

		await waitFor(() => {
			expect(result.current.books.length).toBeGreaterThan(0);
		});
	});

	test("addBookが新しい本を追加する", async () => {
		const { result } = renderHook(() => useBookshelf());

		const newBook = {
			title: "新しい本",
			status: "unread" as const,
			type: "book" as const,
		};

		await act(async () => {
			await result.current.addBook(newBook);
		});

		await waitFor(() => {
			const addedBook = result.current.books.find(
				(b) => b.title === "新しい本",
			);
			expect(addedBook).toBeDefined();
			expect(addedBook?.status).toBe("unread");
		});
	});

	test("updateBookStatusが本のステータスを更新する", async () => {
		const { result } = renderHook(() => useBookshelf());

		// まず本を取得
		await act(async () => {
			await result.current.fetchBooks();
		});

		const firstBook = result.current.books[0];

		await act(async () => {
			await result.current.updateBookStatus(firstBook.id, "completed", 100);
		});

		await waitFor(() => {
			const updatedBook = result.current.books.find(
				(b) => b.id === firstBook.id,
			);
			expect(updatedBook?.status).toBe("completed");
			expect(updatedBook?.progress).toBe(100);
		});
	});

	test("deleteBookが本を削除する", async () => {
		const { result } = renderHook(() => useBookshelf());

		// まず本を取得
		await act(async () => {
			await result.current.fetchBooks();
		});

		const initialCount = result.current.books.length;
		const firstBook = result.current.books[0];

		await act(async () => {
			await result.current.deleteBook(firstBook.id);
		});

		await waitFor(() => {
			expect(result.current.books.length).toBe(initialCount - 1);
			expect(
				result.current.books.find((b) => b.id === firstBook.id),
			).toBeUndefined();
		});
	});
}

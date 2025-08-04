/**
 * 本棚機能のカスタムフック
 * APIとの通信とステート管理を行う
 */

"use client";

import { useCallback, useState } from "react";
import type { Book, CreateBookInput } from "../types";

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

			const data = (await response.json()) as { books?: Book[] };
			setBooks(data.books || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "エラーが発生しました");
			// 開発用のモックデータ
			setBooks([
				{
					id: 1,
					title: "Clean Code",
					status: "reading",
					type: "book",
					url: null,
					imageUrl: null,
					progress: 30,
					completedAt: null,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-15",
				},
				{
					id: 2,
					title: "TypeScript Deep Dive",
					status: "unread",
					type: "pdf",
					url: null,
					imageUrl: null,
					progress: 0,
					completedAt: null,
					createdAt: "2024-01-05",
					updatedAt: "2024-01-05",
				},
				{
					id: 3,
					title: "React Patterns",
					status: "completed",
					type: "github",
					url: null,
					imageUrl: null,
					progress: 100,
					completedAt: "2024-01-20",
					createdAt: "2024-01-10",
					updatedAt: "2024-01-20",
				},
			]);
		} finally {
			setLoading(false);
		}
	}, []);

	const addBook = useCallback(async (bookData: CreateBookInput) => {
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

			const newBook = (await response.json()) as Book;
			setBooks((prev) => [...prev, newBook]);

			return newBook;
		} catch (err) {
			setError(err instanceof Error ? err.message : "エラーが発生しました");
			// 開発用のモック処理
			const newBook: Book = {
				id: Date.now(),
				...bookData,
				url: bookData.url || null,
				imageUrl: bookData.imageUrl || null,
				status: "unread",
				completedAt: null,
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
		async (bookId: number, status: Book["status"], progress?: number) => {
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

				const updatedBook = (await response.json()) as Book;
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
									completedAt:
										status === "completed" ? new Date().toISOString() : null,
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

	const deleteBook = useCallback(async (bookId: number) => {
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

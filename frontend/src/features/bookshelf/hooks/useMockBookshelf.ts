/**
 * 開発環境用のモック本棚フック
 * 実際のAPIを使用せずにローカルで動作確認するための実装
 */

"use client";

import { useCallback, useState } from "react";
import { mockBooks } from "../mocks/mockData";
import type { Book, CreateBookInput } from "../types";

export function useMockBookshelf() {
	const [books, setBooks] = useState<Book[]>(mockBooks);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchBooks = useCallback(async () => {
		setLoading(true);
		setError(null);

		// 非同期処理をシミュレート
		await new Promise((resolve) => setTimeout(resolve, 500));

		setBooks(mockBooks);
		setLoading(false);
	}, []);

	const addBook = useCallback(async (bookData: CreateBookInput) => {
		setLoading(true);
		setError(null);

		// 非同期処理をシミュレート
		await new Promise((resolve) => setTimeout(resolve, 300));

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
		setLoading(false);

		return newBook;
	}, []);

	const updateBookStatus = useCallback(
		async (bookId: number, status: Book["status"], progress?: number) => {
			setLoading(true);
			setError(null);

			// 非同期処理をシミュレート
			await new Promise((resolve) => setTimeout(resolve, 300));

			setBooks((prev) =>
				prev.map((book) =>
					book.id === bookId
						? {
								...book,
								status,
								progress: progress ?? book.progress,
								completedAt:
									status === "completed" ? new Date().toISOString() : null,
								updatedAt: new Date().toISOString(),
							}
						: book,
				),
			);

			setLoading(false);

			const updatedBook = books.find((b) => b.id === bookId);
			return updatedBook || books[0];
		},
		[books],
	);

	const deleteBook = useCallback(async (bookId: number) => {
		setLoading(true);
		setError(null);

		// 非同期処理をシミュレート
		await new Promise((resolve) => setTimeout(resolve, 300));

		setBooks((prev) => prev.filter((book) => book.id !== bookId));
		setLoading(false);
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
	const { test, expect } = import.meta.vitest;
	const { renderHook, act } = await import("@testing-library/react");

	test("初期状態でモックデータが設定される", () => {
		const { result } = renderHook(() => useMockBookshelf());
		expect(result.current.books).toHaveLength(3);
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	test("本を追加できる", async () => {
		const { result } = renderHook(() => useMockBookshelf());
		const newBook: CreateBookInput = {
			title: "Test Book",
			type: "book",
		};

		await act(async () => {
			await result.current.addBook(newBook);
		});

		expect(result.current.books).toHaveLength(4);
		expect(result.current.books[3].title).toBe("Test Book");
	});
}

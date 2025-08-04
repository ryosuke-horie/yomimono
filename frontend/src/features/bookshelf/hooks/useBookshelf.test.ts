/**
 * useBookshelfフックのテスト
 */

import { act, expect, renderHook, test, waitFor } from "@/test-utils";
import { useBookshelf } from "./useBookshelf";

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
		const addedBook = result.current.books.find((b) => b.title === "新しい本");
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
		const updatedBook = result.current.books.find((b) => b.id === firstBook.id);
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

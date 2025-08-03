/**
 * 本のグリッド表示コンポーネント
 * ステータスに応じた本をグリッド形式で表示
 */

"use client";

import { useEffect, useState } from "react";
import { useBookshelf } from "../hooks/useBookshelf";
import type { Book, BookStatus } from "../types";
import { BookCard } from "./BookCard";

interface BookGridProps {
	status: BookStatus;
}

export function BookGrid({ status }: BookGridProps) {
	const { books, loading, error, fetchBooks } = useBookshelf();
	const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

	useEffect(() => {
		fetchBooks();
	}, [fetchBooks]);

	useEffect(() => {
		setFilteredBooks(books.filter((book) => book.status === status));
	}, [books, status]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div
					data-testid="loading-spinner"
					className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
				/>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center text-red-600 p-8">
				<p>本の取得に失敗しました</p>
				<button
					type="button"
					onClick={fetchBooks}
					className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					再試行
				</button>
			</div>
		);
	}

	if (filteredBooks.length === 0) {
		const statusLabels = {
			unread: "未読",
			reading: "読書中",
			completed: "読了",
		};
		return (
			<div className="text-center text-gray-500 p-12">
				<p>{statusLabels[status]}の本はありません</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
			{filteredBooks.map((book) => (
				<BookCard key={book.id} book={book} />
			))}
		</div>
	);
}

if (import.meta.vitest) {
	const { test, expect, render, screen, waitFor } = await import(
		"@/test-utils"
	);
	const { vi } = await import("vitest");

	// モックフック
	vi.mock("../hooks/useBookshelf", () => ({
		useBookshelf: vi.fn(() => ({
			books: [
				{
					id: "1",
					title: "テスト本1",
					status: "unread",
					type: "book",
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
				{
					id: "2",
					title: "テスト本2",
					status: "reading",
					type: "pdf",
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			],
			loading: false,
			error: null,
			fetchBooks: vi.fn(),
		})),
	}));

	test("ローディング状態が表示される", async () => {
		const { useBookshelf } = await import("../hooks/useBookshelf");
		// @ts-expect-error - モック用の型アサーション
		(useBookshelf as jest.Mock).mockReturnValue({
			books: [],
			loading: true,
			error: null,
			fetchBooks: vi.fn(),
		});

		render(<BookGrid status="unread" />);
		expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
	});

	test("エラー状態が表示される", async () => {
		const { useBookshelf } = await import("../hooks/useBookshelf");
		// @ts-expect-error - モック用の型アサーション
		(useBookshelf as jest.Mock).mockReturnValue({
			books: [],
			loading: false,
			error: "エラー",
			fetchBooks: vi.fn(),
		});

		render(<BookGrid status="unread" />);
		expect(screen.getByText("本の取得に失敗しました")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
	});

	test("ステータスに応じた本が表示される", async () => {
		const { useBookshelf } = await import("../hooks/useBookshelf");
		// @ts-expect-error - モック用の型アサーション
		(useBookshelf as jest.Mock).mockReturnValue({
			books: [
				{
					id: "1",
					title: "テスト本1",
					status: "unread",
					type: "book",
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
				{
					id: "2",
					title: "テスト本2",
					status: "reading",
					type: "pdf",
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			],
			loading: false,
			error: null,
			fetchBooks: vi.fn(),
		});

		render(<BookGrid status="unread" />);

		await waitFor(() => {
			expect(screen.getByText("テスト本1")).toBeInTheDocument();
			expect(screen.queryByText("テスト本2")).not.toBeInTheDocument();
		});
	});

	test("本がない場合のメッセージが表示される", async () => {
		const { useBookshelf } = await import("../hooks/useBookshelf");
		// @ts-expect-error - モック用の型アサーション
		(useBookshelf as jest.Mock).mockReturnValue({
			books: [],
			loading: false,
			error: null,
			fetchBooks: vi.fn(),
		});

		render(<BookGrid status="completed" />);
		expect(screen.getByText("読了の本はありません")).toBeInTheDocument();
	});
}
